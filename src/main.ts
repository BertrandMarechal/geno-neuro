import {Population, PopulationParams} from "./classes/population";

(async () => {

    const entityCount = 1000;
    const populationParams: PopulationParams = {
        entityCount,
        inputCount: 1,
        outputCount: 1,
        nodeCounts: [1],
        iteration: 0
    };
    let population = new Population(populationParams);

    const results: number[] = [];

    let maxScore = 0;
    for (let k = 0; k < 100; k++) {
        for (let i = 0; i < entityCount; i++) {
            let right = 0;
            for (let j = 0; j < 50; j++) {
                const n = Math.floor(Math.random() * 1000);

                const isEven = n%2 == 0;

                const entity = population.getEntity(i);
                const [result] = entity.run([
                    (n%2) / 2 + 0.5,
                ]);
                // console.log(n, (n % 2) / 2 + 0.5, result);
                const entitySaysItsEven = result > 0.5;
                if (isEven === entitySaysItsEven) {
                    right++;
                }
            }
            results[i] = right;
        }
        for (let i = 0; i < entityCount; i++) {
            const entity = population.getEntity(i);
            entity.computeScore = () =>  results[i];
            maxScore = Math.max(results[i], maxScore);
        }
        population.finish();
        results.sort();
        populationParams.dnas = population.evolve({
            newCreaturePercent: 20, keepTopPercent: 10, mutationRate: 0.0003
        });
        populationParams.iteration = k + 1;
        population = new Population(populationParams);
        // await new Promise(resolve => setTimeout(resolve, 10));
    }
    console.log(maxScore, population.entities[0].toString());
})();