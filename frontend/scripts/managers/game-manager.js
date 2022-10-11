import Manager			from "./manager.js";
import MapManager		from "./map-manager.js";
import SpriteManager 	from "./sprite-manager.js";
import EventManager		from "./event-manager.js";
import PhysicsManager	from "./physics-manager.js";
import SoundManager		from "./sound-manager.js";
import AIManager		from "./ai-manager.js";

import Player			from "../entities/player.js";
import Enemy			from "../entities/enemy.js";
import Bonus			from "../entities/bonus.js";
import Projectile		from "../entities/projectile.js";
import Finish			from "../entities/finish.js";
import Entity			from "../entities/entity.js";

export default class extends Manager
{
	constructor()
	{
		super();
		this.level	= 1;
		this.score	= 0;
	}

	async load(main_context, additional_context)
	{
		this.context	= main_context;
		this.info		= additional_context;

		const _managers 			= {};
		_managers.map_manager		= new MapManager(this.#static_dir);
		_managers.sprite_manager	= new SpriteManager(this.#static_dir);
		_managers.event_manager		= new EventManager(this.context);
		_managers.physics_manager	= new PhysicsManager();
		_managers.sound_manager		= new SoundManager(this.#static_dir);
		_managers.ai_manager		= new AIManager();
		_managers.game_manager		= this;

		this.#link_managers(_managers);

		const map_load		= _managers.map_manager.load(
			`${this.#static_dir}/${this.#map_name}${this.level}.json`
		);
		const sprites_load	= _managers.sprite_manager.load(
			`${this.#static_dir}/${this.#sprites_name}`
		);
		const sound_load	= _managers.sound_manager.load(
			["steps.ogg", "fire.ogg", "dead.ogg"]
		);

		await map_load;
		await sprites_load;
		await sound_load;

		for (let entity of this.entities)
			_managers.ai_manager.connect(entity);
		_managers.ai_manager.connect_player(this.player);

		this.context.canvas.width	= _managers.map_manager.view.w;
		this.context.canvas.height	= _managers.map_manager.view.h;

		this.info.canvas.width		= _managers.map_manager.view.w;
		this.info.canvas.height		= 64;

		this._loaded	=	_managers.map_manager.is_loaded() && 
							_managers.sprite_manager.is_loaded() && 
							_managers.sound_manager.is_loaded();
		this._error		=	!this._loaded;
	}

	async unload()
	{
		clearInterval(this.game_loop);

		this._loaded		= false;
		this._error			= false;

		this.#destroyed		= this.entities;
		this.#clear_destroyed();
		this.#destroyed 	= [];
		this.attack_count	= 0;
		this.managers.get("event_manager").unload(this.context);
		this.managers.get("sound_manager").stop();

		this.context.clearRect(
			0, 0, 
			this.context.canvas.width, this.context.canvas.height
		);
		this.info.clearRect(
			0, 0, 
			this.info.canvas.width, this.info.canvas.height
		);
	}

	update()
	{
		if (!this.is_loaded() || !this.player)
			return;
		this.player.move_x	= 0;
		this.player.move_y	= 0;
		/* handling events */
		const events = this.managers.get("event_manager");
		if (events.action.get("up"))
			this.player.move_y		+= -1;
		if (events.action.get("down"))
			this.player.move_y		+=  1;
		if (events.action.get("left"))
			this.player.move_x		+= -1;
		if (events.action.get("right"))
			this.player.move_x		+=  1;
		if (events.action.get("attack"))
			this.player.attack();
		/* change crosshair position */
		this.player.view_pos.x	= events.m_pos.x - this.player.size.x / 2;
		this.player.view_pos.y	= events.m_pos.y - this.player.size.y / 2;
		/* update entities state */
		this.managers.get("ai_manager").update();
		// clearInterval(this.game_loop);
		for (let entity of this.entities)
		{
			try
			{
				entity.update();
			} catch (e)
			{}
		}
		/* clear destroyed entities */
		this.#clear_destroyed();
		/* redraw */
		this.draw();
		this.draw_info();
	}

	async draw()
	{
		if (!this.is_loaded())
			return;
		await this.managers.get("map_manager").draw(this.context);	
		for (let entity of this.entities)
			await entity.draw(this.context);
		await this.player.draw(this.context);
		this.managers.get("map_manager").center_at(
			this.player.pos_x,
			this.player.pos_y
		);
	}

	async draw_info()
	{
		if (!this.is_loaded())
			return;
		let heart_x		= 0;
		let heart_y		= 0;
		const sprite	= this.managers.get("sprite_manager")
			.get_sprite("bonus");

		this.info.clearRect(
			0, 0, 
			this.info.canvas.width, this.info.canvas.height
		);
		for (let i = 0; i < this.player.lifetime; ++i, heart_x += 48)
		{
			this.info.drawImage(
				this.managers.get("sprite_manager").image,
				sprite.x, sprite.y,
				sprite.w, sprite.h,
				heart_x , heart_y ,
				sprite.w, sprite.h
			);
		}
		this.info.font		= "32px serif";
		this.info.fillStyle	= "#d3d3d3"
		const text_x		= this.info.canvas.width - 200;
		this.info.fillText(`Score: ${this.score}`, text_x, 40, 200);
	}

	destroy(entity)
	{
		this.#destroyed.push(entity);
	}

	play()
	{
		this.game_loop	= setInterval(() => this.update(), 50);
	}

	#clear_destroyed()
	{
		for (let entity of this.#destroyed)
		{
			const idx	= this.entities.indexOf(entity);
			if (idx > -1)
			{
				if (entity.animation)
					clearInterval(entity.animation); // clear walk animation
				this.entities.splice(idx, 1);
			}
		}
		this.#destroyed.length = 0;
	}

	create(ent_class)
	{
		switch(ent_class)
		{
			case "player":
				return new Player(this);
			case "enemy":
				return new Enemy(this);
			case "bonus":
				return new Bonus(this);
			case "projectile":
				return new Projectile(this);
			case "finish":
				return new Finish(this);
			default:
				return new Entity(this);
		}
	}

	async game_over(is_win = false)
	{
		this.score	+= this.player.lifetime * 1000;
		this.unload();
		this.show_results(is_win);
		if (!is_win)
		{
			await this.#send_results();
			setTimeout(() => window.location.reload(), 3000);
			return;
		}
		setTimeout(async () => {
			++this.level;
			if (this.level > this.max_level)
			{
				await this.#send_results();
				window.location.reload();
				return;
			}
			await this.load(this.context, this.info);
			this.play();
			this.hide_results();
		}, 3000);			
	}

	async #send_results()
	{
		const request = await fetch("/results", {
			method	: "PUT",
			headers	: {
				"Content-Type": "application/json"
			},
			body	: JSON.stringify({
				name	: localStorage.getItem("playername"),
				score	: this.score,
				levels	: this.level - 1
			})
		});
		return true;
	}

	show_results(is_win = false)
	{
		let message	= "";
		const block	= document.getElementById("game-over");

		if (is_win)
			message += `Level ${this.level} completed!\n Total score: ${this.score}`;
		else
			message += `Game Over!\nLevel ${this.level} failed! Try again`;

		block.style.display = "block";
		block.innerHTML		= `
			<h1>${message}</h1>
		`;
	}

	hide_results()
	{
		document.getElementById("game-over").style.display = "none";
	}

	init_player(player)
	{
		this.player = player;
	}

	#link_managers(managers)
	{
		for (let name in managers)
			managers[name].link_managers(managers);
	}

	level			= 0;
	max_level		= 2;
	score			= 0;

	game_loop		= null;
	entities		= [];
	player			= null;
	context			= null;
	attack_count	= 0;

	#destroyed		= [];
	#static_dir		= "storage";
	#map_name		= "level";
	#sprites_name	= "sprites.json";
}; 