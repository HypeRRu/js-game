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

	async load(path)
	{
		this._loaded	= false;
		this._error		= false;
		try
		{
			const request = await fetch(path);
			if (!request.ok)
				throw "Fetch failed";
			await this.#parse(await request.json());
			await this.wait_until_loaded(); // waiting for images loaded
		} catch (e)
		{
			console.error("Error while fetching and parsing MapManager file");
		}
		return this._loaded;
	}

	async #parse(data)
	{
		this.map_data 	= data; // entire map data
		this.x_count	= data.width; // map width in tiles 
		this.y_count	= data.height; // map height in tiles
		this.tile_size	= {x: data.tilewidth, y: data.tileheight};
		this.map_size	= {
			x: this.x_count * this.tile_size.x,
			y: this.y_count * this.tile_size.y
		}; // map size in pixels
		/* load tiles images */
		let img_counter	= 0;
		let img_loaded	= false;
		for (let tile of data.tilesets)
		{
			let img		= new Image();
			img.onload	= () => {
				++img_counter;
				this._loaded	= img_counter === data.tilesets.length;
			};
			img.onerror	= () => {
				this._error		= true;
			};
			img.src		= this.#images_dir + tile.image; // load image
			let tileset	= { // create tileset
				firstgid: tile.firstgid,
				image	: img,
				name	: tile.name,
				x_count	: Math.floor(tile.imagewidth / this.tile_size.x),
				y_count	: Math.floor(tile.imageheight / this.tile_size.y),
			};
			this.tilesets.push(tileset);
		}
		/* initialize tile_layers if needed */
		if (!this.tile_layers.length) 
		{
			for (let layer of this.map_data.layers)
			{
				if (layer.type === "tilelayer")
					this.tile_layers.push(layer);
			}
		}
		await this.parse_entities();
		return await this.build_map_graph();
	}

	async parse_entities()
	{
		if (!await this.wait_until_loaded())
		{
			console.error("MapManager not loaded");
			return false;
		}
		for (let layer of this.map_data.layers)
		{
			/* searching object groups */
			if (layer.type === "objectgroup")
			{
				/* parsing entities */
				for (let entity of layer.objects)
				{
					try
					{
						/* create entity */
						const ent = this.managers.get("game_manager")
							.create(entity.class);

						ent.name	= entity.name;
						ent.pos_x 	= entity.x;
						ent.pos_y	= entity.y;
						ent.size	= {
							x: entity.width,
							y: entity.height
						};
						/* save entity */
						this.managers.get("game_manager")
							.entities.push(ent);
						if (ent.name === "player")
						{
							this.managers.get("game_manager")
								.init_player(ent);
						}
					} catch (e)
					{
						console.error(`Error while creating [${entity.gid}] ${entity.class}: ${e}`);
					}
				}
			}
		}
		return true;
	}

	async build_map_graph()
	{
		for (let layer of this.tile_layers)
		{
			let index	= 0;
			/* iterate over data */
			for (let map_y = 0; map_y < layer.height; ++map_y)
			{
				for (let map_x = 0; map_x < layer.width; ++map_x, ++index)
				{
					const paths	= [];
					this.map_graph.set(index, paths);
					/* if checked cell is wall, skip it*/
					if (layer.data[index] == this.wall_idx)
						continue;
					/* check borders */
					for (let y = map_y - 1; y <= map_y + 1; ++y)
					{
						for (let x = map_x - 1; x <= map_x + 1; ++x)
						{
							if (
								layer.data[y * layer.width + x] == 
								this.wall_idx ||
								y < 0 || y >= layer.height ||
								x < 0 || x >= layer.width  ||
								(x == map_x && y == map_y)
							)
								continue;
							/* if no wall, entity can move here */
							paths.push(y * layer.width + x);
						}
					}
				}	
			}
		}
	}

	async draw(ctx)
	{
		if (!await this.wait_until_loaded())
		{
			console.error("MapManager not loaded");
			return false;
		}
		for (let layer of this.tile_layers)
		{
			for (let i = 0; i < layer.data.length; ++i)
			{
				const tile_index = layer.data[i];
				if (!tile_index)
					continue;
				const tile	= this.#get_tile(tile_index); // get tile by index
				/* get tile coordinates (pixels) */
				let pX		= (i % this.x_count) * this.tile_size.x;
				let pY		= 
					Math.floor(i / this.x_count) * this.tile_size.y;
				/* check view */
				if (!this.is_visible(
					pX, pY, 
					this.tile_size.x, this.tile_size.y
				))
					continue;
				/* move tile to the view */
				pX			-= this.view.x;
				pY			-= this.view.y;
				/* draw tile */
				ctx.drawImage(
					tile.img, 
					tile.pX, tile.pY, 
					this.tile_size.x, this.tile_size.y,
					pX, pY,
					this.tile_size.x, this.tile_size.y
				);
			}
		}
		return true;
	}

	#get_tile(tile_index)
	{
		const tile		= {
			img: null,
			pX: 0, pY: 0
		};
		/* get tileset that contains tile needed */
		const tileset	= this.#get_tileset(tile_index);
		if (!tileset)
			return tile;
		/* tile index in tileset */
		const id		= tile_index - tileset.firstgid;

		tile.img		= tileset.image;
		tile.pX			= (id % tileset.x_count) * this.tile_size.x;
		tile.pY			= Math.floor(id / tileset.x_count) * this.tile_size.y;

		return tile;
	}

	#get_tileset(tile_index)
	{
		for (let i = this.tilesets.length - 1; i >= 0; --i)
		{
			if (this.tilesets[i].firstgid <= tile_index)
				return this.tilesets[i];
		}
		return null;
	}

	get_tileset_idx(x, y)
	{
		/* get tile by coords */
		const idx	= Math.floor(y / this.tile_size.y) * this.x_count +
			Math.floor(x / this.tile_size.x);
		const layers = this.tile_layers;
		for (let i = 0; i < this.tile_layers.length; ++i)
		{
			let layer = this.tile_layers[i];
			if (layer.data[idx])
				return layer.data[idx];
		}
		return null;
	}

	center_at(x, y)
	{
		this.view.x	= 0;
		this.view.y = 0;
		if (x > this.view.w / 2) // center horizontally
		{
			if (x > this.map_size.x - this.view.w / 2)
				this.view.x	= this.map_size.x - this.view.w;
			else
				this.view.x	= x - (this.view.w / 2);
		}
		if (y > this.view.h / 2) // center vertically
		{
			if (y > this.map_size.y - this.view.h / 2)
				this.view.y	= this.map_size.y - this.view.h;
			else
				this.view.y	= y - (this.view.h / 2);
		}
	}

	is_visible(x, y, width, height)
	{
		return !(
			x + width		< this.view.x ||
			y + height		< this.view.y ||
			x > this.view.x	+ this.view.w ||
			y > this.view.y	+ this.view.h
		);
	}

	map_graph	= new Map();
	map_data	= null;

	tile_layers	= [];
	x_count		= 0;
	y_count		= 0;

	tile_size	= {x: 64, y: 64};
	map_size	= {x: 20, y: 15};

	tilesets	= [];
	view		= {x: 0, y: 0, w: 800, h: 600};

	#images_dir	= null;
	wall_idx	= 2;
};
