import java.util.*;
public class ProcessNodes extends Thread {
	// Fields
	private TreeSet<Node> queue;
	public int numRows;
	public Cost c;
	private long bestTour = Long.MAX_VALUE;
	private long totalNodeCount = 0L;
	private boolean stop = false;
	private TSP tsp;
	private int threadNumber;
	// Constructor
	public ProcessNodes (int threadNumber, TreeSet<Node> queue, int numRows, Cost c, long totalNodeCount, TSP tsp) {
		this.threadNumber = threadNumber; 
		this.queue = queue;
		this.numRows = numRows;
		this.c = c;
		this.tsp = tsp;
	}
	public void setStop () {
		stop = true;
	}
	public void run () {
		while (!stop && queue.size() > 0) {
			Node next = (Node) queue.first();
			/*if (next.size() == TSP.numRows && next.lowerBound() < TSP.bestTour) {
				tsp.output2(next, threadNumber, queue, totalNodeCount);
			}*/
			synchronized (queue) {
				queue.remove(next);
			}
			if (next.lowerBound() < TSP.bestTour) {
				if(next.size() == TSP.numRows){
					tsp.output2(next, threadNumber, queue, totalNodeCount);
				}
				
				int newLevel = next.level() + 1;
				byte[] nextCities = next.cities();
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
						if (totalNodeCount % 100000 == 0) {
							System.out.print(".");
						}
						if (totalNodeCount % 1000000 == 0) {
							tsp.output1(threadNumber, queue, totalNodeCount);
						}
						newNode.computeLowerBound(); 
						long lowerBound = newNode.lowerBound();
						//
						if (lowerBound < TSP.bestTour) {
							//System.out.println(Arrays.toString(newTour));
							//System.out.println(lowerBound);
							synchronized (queue) {
								queue.add(newNode);
							}
						} else {
							newNode = null;
						}
					}
				}
			}
			else {
				next = null;
			}
		}
		if (!stop) {
			tsp.stop(false, threadNumber);
		}
	}

	public long totalNodeCount () {
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