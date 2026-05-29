// The per-tick simulation pipeline. This is the ONLY code that mutates the model
// on a tick. Each phase inserts its stage here in a fixed order:
//
//   land value -> utilities -> services -> demand -> roads -> zoning ->
//   development -> economy -> stats
//
// (Phase B: the pipeline only advances the clock. Phase C onward fills it in.)

export function tick(city) {
  city.tick++;
  // Stages added in later phases will run here, e.g.:
  //   diffuseLandValue(city);
  //   updateUtilities(city);
  //   updateServices(city);
  //   updateDemand(city);
  //   extendRoads(city);
  //   updateZoning(city);
  //   developBuildings(city);
  //   runEconomy(city);
  //   computeStats(city);
}
