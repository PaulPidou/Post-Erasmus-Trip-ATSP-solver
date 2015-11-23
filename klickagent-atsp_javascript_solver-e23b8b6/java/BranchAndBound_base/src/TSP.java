// TSP Branch and Bound Main Driver

import java.util.*;
import java.io.*;

import util.TimeInterval;
public class TSP implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	
	// Fields
	public static int numRows;
	private int numCols;
	private long bestTour = Integer.MAX_VALUE / 4;
	private Node bestNode;
	private TreeSet<Node> queue = new TreeSet<Node>(); 
	public static Cost c;
	private long totalNodeCount = 0L;
	private double threshold;
	private boolean stop = false;
	private double elapsedTime = 0.0;
	public TSP (long [][] costMatrix, int size, long bestTour, double threshold) {
		this.threshold = threshold;
		this.bestTour = bestTour;
		numRows = numCols = size;
		c = new Cost(numRows, numCols);
		for (int row = 0; row < size; row++)
			for (int col = 0; col < size; col++)
				c.assignCost(costMatrix[row][col], row, col);
	}
	public void write(ObjectOutputStream stream) {
		try {
			stream.writeInt(numRows);
			stream.writeLong(bestTour);
			stream.writeLong(totalNodeCount);
			stream.writeObject(bestNode);
			Object [] nodes = queue.toArray();
			stream.writeInt(queue.size());
			for (int i = 0; i < nodes.length; i++) {
				stream.writeObject(nodes[i]);
			}
		} catch (Exception ex) {
			System.out.println(ex);
		}
	}
	public void read(ObjectInputStream stream) {
		try {
			numRows = stream.readInt();
			bestTour = stream.readInt();
			totalNodeCount = stream.readLong();
			bestNode = (Node) stream.readObject();
			int queueSize = stream.readInt();
			Node [] nodes = new Node[queueSize];
			for (int i = 0; i < queueSize; i++) {
				nodes[i] = (Node) stream.readObject();
				queue.add(nodes[i]);
			}
		} catch (Exception ex) {
			System.out.println(ex);
		}
	}
	public void stop () {
		stop = true;
	}
	public void generateSolution (boolean ongoing) {
		TimeInterval t = new TimeInterval();
		t.startTiming();
		if (!ongoing) {
			// Create root node
			byte[] cities = new byte[1]; 

			cities[0] = 0;
			Node root = new Node(cities, 1);
			root.setLevel(1);
			totalNodeCount++;
			root.computeLowerBound();
			System.out.println(
					"The lower bound for root node (no constraints): " +
							root.lowerBound());
			queue.add(root);
		}
		while (!stop && elapsedTime <= threshold &&
				queue.size() > 0) {
			Node next = (Node) queue.first();
			if (next.size() == TSP.numRows &&
					next.lowerBound() < bestTour) {
				t.endTiming();
				bestTour = next.lowerBound();
				bestNode = next;
				System.out.println("\nNodes generated: " +
						totalNodeCount);
				System.out.println("Best tour cost: " + bestNode.cost());
				System.out.println("Best tour: " + bestNode);
				System.out.println("queue.size(): " + queue.size());
				double time = t.getElapsedTime();
				elapsedTime = time;
				System.out.println("Elapsed time: " +
						t.getElapsedTime() +
						" milliseconds.");
			}
			queue.remove(next);
			if (next.lowerBound() < bestTour) {
				int newLevel = next.level() + 1;
				byte [] nextCities = next.cities();
				int size = next.size();
				for (int city = 1; !stop && city < TSP.numRows;	city++) {
					if (!present((byte) city, nextCities)) {
						byte [] newTour = new byte[size + 1];
						for (int index = 0; index < size; index++) {
							newTour[index] = nextCities[index];
						}
						newTour[size] = (byte) city;
						Node newNode = new Node(newTour, size+1  );
						newNode.setLevel(newLevel);
						totalNodeCount++;
						if (totalNodeCount % 100000 == 0) {
							System.out.print(".");
						}
						if (totalNodeCount % 1000000 == 0) {
							t.endTiming();
							System.out.println();
							System.out.println("\nNodes generated: " +
									totalNodeCount / 1000000 +
									" million nodes.");
							System.out.println("queue.size(): " + 
									queue.size());
							if (bestTour != Integer.MAX_VALUE / 4) {
								System.out.println("Best tour cost: " +
										bestNode.cost());
								if (totalNodeCount % 10000000 == 0) {
									System.out.println("Best tour: " +
											bestNode);
									System.out.println(
											"Session ends after " +
													threshold + " seconds.");
									System.out.println();
									System.out.println(
											"Distribution of Levels In Queue from " +
													((Node) queue.last()).level() + " to " +
													((Node) queue.first()).level());
									int[] number =
											new int[TSP.numRows];
									for (Iterator<Node> iter =
											queue.iterator();
											iter.hasNext(); ) {
										Node n = (Node) iter.next();
										number[n.level()]++;
									}
									System.out.println();
									for (int i = 2; i < TSP.numRows;
											i++) {
										System.out.print(i + ": " +
												number[i] + " ");
										if (i % 5 == 0) {
											System.out.println();
										}
									}
									System.out.println("\n");
								}
								double time = t.getElapsedTime();
								elapsedTime = time;
								System.out.println("Elapsed time: " +
										t.getElapsedTime() +
										" milliseconds.");
							}
						}
						newNode.computeLowerBound();
						long lowerBound = newNode.lowerBound();
						if (lowerBound < bestTour) {
							queue.add(newNode);
						} else {
							newNode = null;
						}
					}
				}
			} else {
				next = null; 
			}
		}
		t.endTiming();
		if (elapsedTime >= threshold) {
			System.out.println(
					"\n\nAlgorithm terminated since no new best tour found after " +
							threshold + " new nodes generated.");
			System.out.println(
					"The results should be considered a heuristic approximation.");
		} else {
			System.out.println("\n\nAn optimum tour has been found.");
		}
		double time = t.getElapsedTime();
		elapsedTime = time;
		
		System.out.println("\n\nCost of tour: " + bestNode.cost() +
				"\nTour: " + bestNode +
				"\nTotal of nodes generated: " +
				totalNodeCount);
		System.out.println(
				"Elapsed time: " + t.getElapsedTime() + " milliseconds.");
		System.out.println();
	}
	// Queries
	public long nodesCreated () {
		return totalNodeCount;
	}
	public Node bestNode () {
		return bestNode;
	}
	public long bestTour () {
		return bestTour;
	}
	public long nodesGenerated () {
		return totalNodeCount;
	}
	private boolean present (byte city, byte [] cities) {
		for (int i = 0; i < cities.length; i++) {
			if (cities[i] == city) {
				return true;
			}
		}
		return false;
	}
}