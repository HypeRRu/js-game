import https from "https";
import express from "express";
import ejs from "ejs";
import fs from "fs";
import routes from "./routes.js";
/* create application */
const application = express();
const ssl_options = {
	key: fs.readFileSync("backend/ssl/game.key"),
	cert: fs.readFileSync("backend/ssl/game.crt")
};

application.use(express.json());
application.use(express.urlencoded({ extended: false }));

/* set router and view engine */
application.use("/storage", express.static("backend/storage"));
application.use(express.static("frontend"));
application.set("view engine", "ejs");
application.set("views", "frontend/views");
application.use("/", routes);

/* set server */
const server = https.createServer(
	ssl_options,
	application
);
server.listen(8000);
