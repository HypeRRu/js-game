import GameManager from "./managers/game-manager.js";

const game_manager	= new GameManager();
const context		= 
	document.getElementById("game-field").getContext("2d");
const info			= 
	document.getElementById("game-info").getContext("2d");

async function load_records()
{
	const request	= await fetch("/results");
	const content	= await request.json();
	fill_table(content);
}

function fill_table(records)
{
	const tbody	= document.getElementById("results").tBodies[0];
	if (!records.length)
	{
		const cell				= tbody.insertRow().insertCell();
		cell.colSpan 			= 3;
		cell.innerText 			= "Нет записей";
		cell.style.textAlign	= "center";
		return;
	}

	for (let record of records)
	{
		const row	= tbody.insertRow();
		row.insertCell().innerText	= record.name;
		row.insertCell().innerText	= record.score;
		row.insertCell().innerText	= record.levels;
	}
}

function store_name(name)
{
	if (!name.length)
		return false;
	localStorage.setItem("playername", name);
	return true;
}

async function main()
{
	await game_manager.load(context, info);
	game_manager.play();
}

load_records();
document.getElementById("play").onclick = async () => {
	if (!store_name(document.getElementById("player-name").value))
	{
		return;
	}
	await main();
	document.getElementById("cover").style.display = "none";
}