/**
 * TSP Branch and Bound
 */
import java.util.*;
import java.io.*;

import util.TimeInterval;

public class TSP implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 0L;

	// Fields
	public static int numRows;
	public static Node bestNode;
	public static long bestTour = Integer.MAX_VALUE / 4; 
	public static Cost c;
	public static TimeInterval t = new TimeInterval();
	private TreeSet<Node> queue = new TreeSet<Node>();
	private long totalNodeCount = 0L;
	private boolean stop = false;
	private static int numberThreads = 6;
	private ProcessNodes [] threads = new ProcessNodes[numberThreads];
	private int numberStopped = 0;
	private double accumulatedTime = 0.0;

	public long bestTour () {
		return this.bestTour;
	} 

	public TSP (long [][] costMatrix, int size) {
		numRows = size;
		c = new Cost(numRows, numRows);
		for (int row = 0; row < size; row++){
			for (int col = 0; col < size; col++){
				c.assignCost(costMatrix[row][col], row, col);
			}
		}
	}

	public void output1 (int threadNumber, TreeSet<Node> queue, long totalNodeCount) { 
		System.out.println();
		System.out.println("Thread number: " + threadNumber);
		TSP.t.endTiming();
		System.out.println("Elapsed time: " +
				TSP.t.getElapsedTime() + " milliseconds.");
		System.out.println("Nodes generated: " +
				totalNodeCount / 1000000 +
				" million nodes.");
		System.out.println("queue.size(): " +
				queue.size());
		if (this.bestTour != Integer.MAX_VALUE / 4) {
			System.out.println("Best tour cost: " +
					TSP.bestNode.cost());
			System.out.println("Best tour: " + TSP.bestNode);
			System.out.println();
		}
	}
	public synchronized void output2 (Node next, int threadNumber, TreeSet<Node> queue, long totalNodeCount) {


		long bestTour2 = next.lowerBound();
		if (bestTour2 < this.bestTour) {

			this.bestNode = next;
			this.bestTour = bestTour2;

			System.out.println();
			System.out.println("\nThread number: " + threadNumber +
					" improves best score.");
			t.endTiming();
			System.out.println(
					"Elapsed time: " + TSP.t.getElapsedTime() +
					" milliseconds.");
			System.out.println("Nodes generated: " + totalNodeCount);
			System.out.println("Best tour cost: " + bestNode.cost());
			System.out.println("Best tour: " + bestNode);
			System.out.println("queue.size(): " + queue.size());
			System.out.println();
		}

	}
	public synchronized void stop (boolean forced, int threadNumber) {
		if (forced && stop) {
			return;
		}
		if (queue.size() == 0) {
			numberStopped++;
		} else if (!forced) {
			TreeSet t = new TreeSet<Node>();
			Node n = (Node) queue.first();
			t.add(n);
			long totalNodeCount = threads[threadNumber - 1].totalNodeCount();
			threads[threadNumber - 1] = new ProcessNodes(threadNumber, t, numRows, c, totalNodeCount, this);
			threads[threadNumber - 1].start();
			synchronized (queue) {
				queue.remove(n);
			}
		}
		if (numberStopped == numberThreads || forced) {
			stop = true;
			for (int i = 0; i < numberThreads; i++) {
				threads[i].setStop();
			}
			t.endTiming();
			// Count the total number of nodes generated from the
			// threads
			long nodesGenerated = 0;
			for (int i = 0; i < numberThreads; i++) {
				nodesGenerated += threads[i].totalNodeCount();
			}
			totalNodeCount += nodesGenerated;
			if (!forced) {
				System.out.println("Optimum solution obtained.");
			} else {
				System.out.println(
						"Solution forced to stop prematurely and may not be optimum.");
			} 
			System.out.println(
					"The total number of nodes generated: " +
							totalNodeCount);
			System.out.println("Tour cost: " + bestNode.cost());
			System.out.println(
					"Elapsed time: " + (TSP.t.getElapsedTime() +
							accumulatedTime) +
					" milliseconds.");
		}
	}

	public void generateSolution (boolean ongoing) {
		t.startTiming();
		if (!ongoing) {
			// Create root node
			byte[] cities = new byte[1];
			cities[0] = 0;
			Node root = new Node(cities, 1);
			//bestNode = root;

			root.setLevel(1);
			totalNodeCount++;
			root.computeLowerBound();
			System.out.println(
					"The lower bound for root node (no constraints): " +
							root.lowerBound());
			queue.add(root);
			Node next = (Node) queue.first();
			synchronized (queue) {
				queue.remove(next);
			}
			int newLevel = next.level() + 1;
			byte [] nextCities = next.cities();
			int size = next.size();
			for (int city = 1; !stop && city < TSP.numRows; city++) {
				if (!present( (byte) city, nextCities)) { 
					byte[] newTour = new byte[size + 1];
					for (int index = 0; index < size; index++) {
						newTour[index] = nextCities[index];
					}
					newTour[size] = (byte) city;
					Node newNode = new Node(newTour, size + 1);
					newNode.setLevel(newLevel);
					totalNodeCount++;
					newNode.computeLowerBound(); 
					long lowerBound = newNode.lowerBound();
					synchronized (queue) {
						queue.add(newNode);
					}

				}
			}
			// Spawn the threads and start the process going
			for (int i = 0; i < numberThreads; i++) {
				TreeSet<Node> t = new TreeSet<Node>();
				Node n = (Node) queue.first();
				synchronized (queue) {
					queue.remove(n);	
				}
				t.add(n);

				threads[i] = new ProcessNodes(i+1, t, numRows, c, 0L, this);

			}
		}
		for (int i = 0; i < numberThreads; i++) {
			threads[i].start();
		}
	}
	private boolean present (byte city, byte [] cities) {
		for (int i = 0; i < cities.length ; i++) {
			if (cities[i] == city) {
				return true;
			}
		}
		return false;
	}
}