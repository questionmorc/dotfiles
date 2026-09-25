/** A spawned process whose lifetime holds a power assertion. */
export interface AssertionProcess {
	kill(): void;
	onExit(listener: () => void): void;
}

export type AssertionSpawner = () => AssertionProcess;

/** Holds at most one assertion process; acquire and release are idempotent. */
export class SleepAssertion {
	#spawn: AssertionSpawner;
	#holder: AssertionProcess | undefined;

	constructor(spawn: AssertionSpawner) {
		this.#spawn = spawn;
	}

	get held(): boolean {
		return this.#holder !== undefined;
	}

	acquire(): void {
		if (this.#holder) return;
		const holder = this.#spawn();
		this.#holder = holder;
		holder.onExit(() => {
			if (this.#holder === holder) this.#holder = undefined;
		});
	}

	release(): void {
		const holder = this.#holder;
		if (!holder) return;
		this.#holder = undefined;
		holder.kill();
	}
}
