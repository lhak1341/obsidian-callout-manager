/**
 * A type representing the ID of a callout.
 */
export type CalloutID = string;

/**
 * A description of a markdown callout.
 */
export type Callout = CalloutProperties;

export interface CalloutProperties {
	/**
	 * The ID of the callout.
	 * This is the part that goes in the callout header.
	 */
	id: CalloutID;

	/**
	 * The current color of the callout.
	 */
	color: string;

	/**
	 * The icon associated with the callout.
	 */
	icon: string;
}

export default Callout;
