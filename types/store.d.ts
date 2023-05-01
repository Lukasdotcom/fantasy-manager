interface store {
  id: string; // Unique ID of the plugin
  version: string; // The version of the plugin(Will only update the code when this changes)
  min_version?: string; // The minimum version of the fantasy manager that is required to run the plugin
  description?: string; // A description of the plugin
  files: string[]; // The files that are used by the plugin. These links will be downloaded. Note that the main file should be called index.ts/index.js.
  input?: inputs[]; // The inputs that are used by the plugin(If it requires any api keys or other inputs)
}
export interface inputs {
  variant: "string"; // The type of the input string is just any string
  name: string; // The name of the input
  description?: string; // A description of the input
}
export default store;
