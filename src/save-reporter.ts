/**
 * Runs settings saves and reports a failure once per streak. `saveData` is not awaited by its
 * callers (every edit saves, see ADR-0002), so without this a rejected write is an unhandled
 * rejection the user never sees and the next edit silently fails the same way.
 */
export class SaveReporter {
	private failing = false;

	/**
	 * @param notify Tells the user; called once when a streak of failures starts.
	 * @param log Records every failure, not only the first.
	 */
	public constructor(
		private readonly notify: (message: string) => void,
		private readonly log: (error: unknown) => void,
	) {}

	public run(save: () => Promise<void> | void): void {
		let pending: Promise<void> | void;
		try {
			pending = save();
		} catch (error) {
			this.fail(error);
			return;
		}

		if (pending) pending.then(() => this.succeed(), (error: unknown) => this.fail(error));
		else this.succeed();
	}

	private succeed(): void {
		this.failing = false;
	}

	private fail(error: unknown): void {
		this.log(error);
		if (this.failing) return;
		this.failing = true;
		this.notify('Callout Manager could not save its settings. Your changes apply now but may be lost on restart.');
	}
}
