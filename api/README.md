# Callout Manager Plugin API

Table of Contents:

- [Installation](#installation)
- [Setup](#setup)
- Types
  - [`Callout`](#callout)
  - [`CalloutID`](#calloutid)
- Functions
  - [`getApi`](#getapi) (package import)
  - [`getCallouts`](#getcallouts)
  - [`getColor`](#getcolor)
  - [`getTitle`](#gettitle)
- Events
  - [`on("change")`](#onchange-listener) / [`off("change")`](#offchange-listener)

## Installation
You can install Callout Manager's plugin API by adding the package through `npm` or `yarn`.

```bash
npm install obsidian-callout-manager
```

## Setup

To use the API, you need to get an API handle. Since we can't guarantee plugin load order, it is recommended you do this under an `onLayoutReady` callback:

```ts
import {CalloutManager, getApi} from "obsidian-callout-manager";

class MyPlugin extends Plugin {
	private calloutManager?: CalloutManager<true>;

	public async onload() {
		this.app.workspace.onLayoutReady(() => {
			this.calloutManager = getApi(this);
		}
	}
}
```

&nbsp;

## Types

### `Callout`
A callout and its properties. Every callout returned by this API was created through Callout
Manager — there's no discovery of Obsidian's built-in, theme-provided, or snippet-provided callouts.
> type **Callout** = {  
> &nbsp;&nbsp;&nbsp; id: [CalloutID](#calloutid),  
> &nbsp;&nbsp;&nbsp; color: string,  
> &nbsp;&nbsp;&nbsp; icon: string,  
> }

**id**: [CalloutID](#calloutid)  
The ID of the callout.  
This is the part that goes in the callout header.  

**color**: string  
The current color of the callout, as a CSS color (hex, `rgb(...)`, or a CSS variable reference).  
If you need to parse this, use [getColor](#getcolor).

**icon**: string  
The icon associated with the callout.

### `CalloutID`
> type **CalloutID** = string;

A type representing the ID of a callout.


&nbsp;

## Functions

### `getApi`
> **getApi(owner: Plugin)**: CalloutManager&lt;true&gt;

Gets an API handle owned by the provided plugin.  

> **getApi()**: CalloutManager

Gets an unowned API handle.  
This only has access to a subset of API functions.

### `getCallouts`
> **(handle).getCallouts()**: ReadonlyArray&lt;[Callout](#callout)&gt;

Gets the list of available callouts.

### `getColor`
> **(handle).getColor(callout: [Callout](#callout))**: RGB | { invalid: string }

Parses the color of a callout into an Obsidian RGB object, or an object containing the property "invalid" if the color is not valid.

If the parsing was successful, you can extract the red, green, and blue channels through `color.r`, `color.g`, and `color.b` respectively.

### `getTitle`
> **(handle).getTitle(callout: [Callout](#callout))**: string

Gets the default title string for the provided callout.

### `on("change", listener)`
> **(owned handle).on("change", listener: () => void)**

Adds an event listener that is triggered whenever one or more callouts are changed.  

This event is intended to be used as a signal for your plugin to refresh any caches or computed data that relied on the callouts as a source. If you need to determine which callouts have changed, that should be done manually.

### `off("change", listener)`
> **(owned handle).off("change", listener: () => void)**

Removes a previously-registered [change](#onchange-listener) event listener.
