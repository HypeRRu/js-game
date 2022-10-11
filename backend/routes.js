import express	from "express";
import fs		from "fs";
const router	= express.Router();

const file_name	= "backend/storage/results.json";
let results		= JSON.parse(
	fs.readFileSync(file_name)
);
const count		= 5;

/* main page */
router.get("/", (req, res) => {
	res.render("index");
});

router.get("/results", (req, res) => {
	res.json(results);
});

router.put("/results", (req, res) => {
	results.push(req.body);
	results = results.sort((a, b) => {
		return +b.score - +a.score;
	});
	results = results.slice(0, count > results.length ? results.length : count);
	fs.writeFileSync(file_name, JSON.stringify(results, null, 4));
	res.status(201).end();
});

/* not found page */
router.get("*", (req, res) => {
	res.status(404).end("Not found");
});

export default router;