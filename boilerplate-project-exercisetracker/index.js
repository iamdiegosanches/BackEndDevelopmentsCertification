const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
let bodyParser = require('body-parser');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
// Create user schema
const userSchema = new Schema({
	username: String
});
const User = mongoose.model("User", userSchema);

// Create exercise schema
const exerciseSchema = new Schema({
	userId: { type: String, required: true },
	username: String,
	description: String,
	duration: Number,
	date: Date
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
});

// Post user
app.post('/api/users', async function(req, res) {
	const newUser = new User({
		username: req.body.username
	})
	try {
		const user = await newUser.save()
		res.json(user)
	} catch(err) {
		console.log(err)
	}
});

// Get all users
app.get('/api/users', async function(req, res) {
	try {
		const allUsers = await User.find();
		res.status(200).json(allUsers)
	} catch (err) {
		res.status(500).json(err);
	}
});


// POST /api/users/:_id/exercises
app.post('/api/users/:_id/exercises', async function(req, res) {
	const id = req.params._id;
	const {description, duration, date} = req.body

	try {
		const  user = await User.findById(id)
		if (!user) {
			res.json({error: "Could not find user"})
		} else {
			const newExercise = new Exercise({
				userId: user._id,
				description,
				duration,
				date: date ? new Date(date) : new Date() 
			})
			const exercise = await newExercise.save()
			res.json({
				_id: user._id,
				username: user.username,
				description: exercise.description,
				duration: exercise.duration,
				date: new Date(exercise.date).toDateString()
			})
		}
	} catch(err) {
		console.log(err)
	}
});


// find logs
app.get('/api/users/:_id/logs', async function (req, res) {
	const {from, to, limit} = req.query;
	const id = req.params._id;
	const user = await User.findById(id);
	if(!user){
		res.json({error: "Could not find user"})
		return
	}
	let dateObj = {}
	if (from) {
		dateObj["$gte"] = new Date(from)
	}
	if (to) {
		dateObj["$lte"] = new Date(to)
	}
	let filter = {
		userId: id
	}
	if (from || to) {
		filter.date = dateObj;
	}

	const exercises = await Exercise.find(filter).limit(+limit ?? 500)

	const log = exercises.map(exercise => ({
		description: exercise.description,
		duration: exercise.duration,
		date: exercise.date.toDateString()
	}))

	res.json({
		username: user.username,
		count: exercises.length,
		_id: user._id,
		log
	})
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
