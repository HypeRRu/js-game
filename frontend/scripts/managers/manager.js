export default class
{
	link_managers(managers)
	{
		for (let name in managers)
		{
			this.managers.set(
				name, managers[name]
			);
		}
	}

	is_loaded()
	{
		return this._loaded && !this._error;
	}

	async wait_until_loaded()
	{
		while (!this._error && !this._loaded)
			await this.#sleep(100);
		return this._loaded;
	}

	#sleep(ms) {
	    return new Promise(resolve => setTimeout(resolve, ms));
	}

	_loaded		= false;
	_error		= true;

	managers	= new Map();
};