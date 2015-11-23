describe("TSPSolver", function() {
	var TSP_Solver_Worker = require('../TSP_Solver_Worker')();
	var TSP_Solver = require('../TSP_Solver')(TSP_Solver_Worker);
	var tsp_solver;
	var tsp;

	jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000000;

	beforeEach(function() {
		tsp_solver = new TSP_Solver.TSP_Solver();
		tsp_solver.addCities(
			[
				[0,14,4,10,20,4,10,33,2,10],
				[14,0,7,8,7,3,2,99,2,32],
				[4,5,0,7,16,12,3,1,6,9],
				[11,7,9,0,2,2,3,2,2,2],
				[18,7,17,4,0,12,3,4,5,7],
				[1,1,7,2,2,0,88,2,3,6],
				[118,7,17,4,100,2,0,5,6,22],
				[182,7,17,4,33,44,3,0,44,9],
				[1,7,17,4,2,3,33,2,0,10],
				[8,7,17,4,33,1,2,5,6,0]
			]
		);
	});

	it("tsp solver should turn distances to same point to infinity", function() {
		//solve_tsp_helper_function(window,{},[[0,2],[3,0]],algo,mode,threadCount,testNr);
	
		expect(tsp_solver.tsp).toBeInstanceOf(TSP_Solver_Worker.tsp);
		//tsp_solver.addCities([[0,2],[3,0]]);		
		expect(tsp_solver.tsp.dist[0][0]).toBe(Infinity);
	});
	describe("solving tsp with bnb, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('bnb','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTour).toEqual([ 0, 2, 7, 6, 3, 4, 9, 5, 1, 8 ]);
			expect(tsp_solver.bestTourWeight).toEqual(26);
		});
	});
	describe("solving tsp with dynamic, normal", function() {
		beforeEach(function(done) {
		
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('dynamic','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTour).toEqual([ 0, 2, 7, 3, 4, 9, 6, 5, 1, 8]);
			expect(tsp_solver.bestTourWeight).toEqual(26);
		});
	});
	describe("solving tsp with bruteForce, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('bruteForce','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTour).toEqual([ 0, 2, 7, 3, 4, 9, 6, 5, 1, 8]);
			expect(tsp_solver.bestTourWeight).toEqual(26);
		});
	});
	
	describe("solving tsp with nearestNeighbour, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('nearestNeighbour','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTour).toEqual([ 0, 8, 4, 6, 5, 1, 2, 7, 3, 9]);
			expect(tsp_solver.bestTourWeight).toEqual(32); //not optimum found!
		});
	});
	
	describe("solving tsp with AntColonyK2, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('AntColonyK2','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTourWeight).toBeLessThan(32); //should be better than nearestneighbour
		});
	});
	
	describe("solving tsp with AntColonyK2_K3, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('AntColonyK2_K3','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTourWeight).toBeLessThan(32); //should be better than nearestneighbour
		});
	});
	describe("solving tsp with K3, normal", function() {
		beforeEach(function(done) {
			tsp_solver.registerEvent('onSuccess',function(){
				done();
			});
			tsp_solver.solve('K3','normal','');
			
		});

		it("should return result", function() {
			expect(tsp_solver.bestTourWeight).toBeLessThan(32); //should be better than nearestneighbour
		});
	});
	
});
