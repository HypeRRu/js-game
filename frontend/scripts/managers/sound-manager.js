import Manager from "./manager.js";

export default class extends Manager
{
	constructor(clips_dir = "")
	{
		super();
		this.context	= new AudioContext();
		this.gain_node	= this.context.createGain();
		this.gain_node.connect(this.context.destination);

		this.#clips_dir = clips_dir;
		if (!this.#clips_dir.endsWith("/"))
			this.#clips_dir	+= "/";
	}

	async load(path_array)
	{
		this._loaded	= false;
		this._error		= false;
		try
		{
			for (let path of path_array)
				this.#load_one(path);
			this._loaded = true;
		} catch (e)
		{
			console.error("Error while fetching and parsing SoundManager's files");
		}
		return this.is_loaded();
	}

	async #load_one(path)
	{
		const request	= await fetch(this.#clips_dir + path);
		if (!request.ok)
		{
			this._error = true;
			throw `Unable to fetch ${path}`;
		}
		const content	= await this.context
			.decodeAudioData(await request.arrayBuffer());
		this.clips.set(path, content);
	}

	async play(path, { volume = 1.0, loop = false } = {})
	{
		if (!await this.wait_until_loaded())
		{
			console.error("SoundManager not loaded");
			return false;
		}
		if (!this.clips.has(path))
		{
			console.error(`Cannot play ${path}`);
			return false;
		}
		const sound					= this.context.createBufferSource();
		sound.buffer				= this.clips.get(path);
		sound.connect(this.gain_node);
		sound.loop					= loop;
		this.gain_node.gain.value	= volume;
		sound.start(0);
		return true;
	}

	async play_on(path, x, y, { volume = 1.0, loop = false } = {})
	{
		const view_size		= Math.max(
			this.managers.get("map_manager").view.w,
			this.managers.get("map_manager").view.h
		) * 0.6;
		const dx			= 
			this.managers.get("game_manager").player.pos_x - x;
		const dy			= 
			this.managers.get("game_manager").player.pos_y - y;
		const distance		= Math.sqrt(dx * dx + dy * dy);
		let normalized		= distance / view_size;

		if (normalized > 1)
			normalized = 1;
		const __volume = (1 - normalized) * volume;
		if (!__volume)
			return;
		await this.play(path, {loop: loop, volume: __volume});
	}

	stop()
	{
		this.gain_node.disconnect();
		this.gain_node	= this.context.createGain();
		this.gain_node.connect(this.context.destination);
	}

	clips		= new Map();
	gain_node	= null;
	context		= null;

	#clips_dir	= "";
}