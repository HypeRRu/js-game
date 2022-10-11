import Manager from "./manager.js";

export default class extends Manager
{
	constructor(images_dir = "")
	{
		super();
		this.#images_dir = images_dir;
		if (!this.#images_dir.endsWith("/"))
			this.#images_dir += "/";
	}

	async load(path /* path to json */)
	{
		this._loaded	= false;
		this._error		= false;
		try
		{
			if (await !this.#load_atlas(path))
				throw "Fetch failed";
			await this.wait_until_loaded();
		} catch (e)
		{
			console.error("Error while fetching and parsing SpriteManager files");
		}
		return this._loaded;
	}

	async #load_atlas(path)
	{
		const request = await fetch(path);
		if (!request.ok)
			return false;
		return await this.#parse_atlas(await request.json());
	}

	async #parse_atlas(atlas)
	{
		this.#load_image(atlas.meta.image);
		for (let sprite_name in atlas.frames)
		{
			const frame = atlas.frames[sprite_name].frame;
			this.sprites.set(
				sprite_name,
				{
					name: sprite_name,
					x	: frame.x,
					y	: frame.y,
					w	: frame.w,
					h	: frame.h
				}
			);
		}
		return true;
	}

	async draw_sprite(ctx, name, x, y, vx, vy)
	{
		if (!await this.wait_until_loaded())
		{
			console.error("SpriteManager not loaded");
			return false;
		}
		/* get sprite by name */
		const sprite = this.get_sprite(name);
		if (!sprite)
			return;
		/* check is sprite visible */
		if (!this.managers.get("map_manager").is_visible(
			x, y, sprite.w, sprite.h
		))
			return;
		ctx.save();
		/* move visible area */
		x	-= this.managers.get("map_manager").view.x;
		y	-= this.managers.get("map_manager").view.y;
		/* rotate and translate sprite */
		const rotation = this.#calc_rotation(x, y, vx, vy);
		this.#transform(ctx, x, y, sprite, rotation);
		/* draw sprite */
		ctx.drawImage(
			this.image,
			sprite.x, sprite.y,
			sprite.w, sprite.h,
			-sprite.w / 2, -sprite.h / 2,
			sprite.w, sprite.h
		);
		ctx.restore();
	}

	#calc_rotation(x, y, view_x, view_y)
	{
		let dx		= x - view_x;
		let dy		= view_y - y;
	
		let angle	= Math.atan(dx / Math.abs(dy));
		if (dy < 0)
			angle	= -angle + Math.PI;

		return angle;
	}

	#transform(ctx, x, y, sprite, rotation)
	{
		if (!ctx)
			return;
		ctx.setTransform(
			1, 0, 0, 1, 
			x + sprite.w / 2, y + sprite.h / 2
		);
    	ctx.rotate(rotation);
	}

	get_sprite(name)
	{
		return this.sprites.has(name) ?
			this.sprites.get(name) : null;
	}

	async #load_image(path)
	{
		this.image		= new Image();
		this.image.onload	= () => {
			this._loaded	= true;
		};
		this.image.onerror	= () => {
			this._error		= true;
		};
		this.image.src	= this.#images_dir + path;
	}

	image		= null;
	sprites		= new Map();
	#image_path	= null;
	#images_dir	= "";
};