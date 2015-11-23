
import java.io.*;
import java.util.Arrays;
public class Node implements Comparable,Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	// Fields
	private long lowerBound;
	private int size; // Number of cities in partial tour
	private byte [] cities; // Stores partial tour
	private boolean [] blocked = new boolean[TSP.numRows];
	private int level; // The level in the tree
	// Constructor
	public Node (byte [] cities, int size) {
		this.size = size;
		this.cities = cities;
	}
	// Commands
	public void computeLowerBound () {
		lowerBound = 0;
		long min;
		if (size == 1) {
			for (int i = 0; i < TSP.numRows; i++) {
				lowerBound += minimum(i);
			}
		} else {
			
			
			// Obtain fixed portion of bound
			for (int i = 1; i < size; i++) {
				blocked[cities[i]] = true;
				min = TSP.c.cost(cities[i-1], cities[i]);
						if( size == 2 ) {
							//System.out.println("#a####"+min);
						}
				lowerBound += min;
			}
			if( TSP.numRows == size ){
				min = TSP.c.cost(cities[size-1], cities[0]);
				lowerBound += min;
				return;
			}
			blocked[0] = true;
			min = minimum(cities[size-1]);
			//System.out.println("#b####"+min);
			lowerBound += min;
			if( min == Long.MAX_VALUE ){
				//System.out.println("#!####\nsize"+size);
				//System.out.println(Arrays.toString(cities));
				//System.out.println(Arrays.toString(blocked));
			}
			blocked[0] = false;
			
			for (int i = 1; i < TSP.numRows; i++) {
				
				if( TSP.numRows == size ){
					lowerBound += TSP.c.cost(cities[i], cities[(i+1)%TSP.numRows]);
				} else {
					
					
					if ( !blocked[i] && cities[size-1] != i ) {
						 min = minimum(i);
						if( size == 2 ) {
							//System.out.println("#c####"+min);
							//System.out.println(Arrays.toString(blocked));
						}
						if( min == Long.MAX_VALUE ){
							//System.out.println("#####\nsize"+size);
							//System.out.println(Arrays.toString(cities));
							//System.out.println(Arrays.toString(blocked));
							//System.out.println("lb "+i);
						}
						////System.out.println(min);
						lowerBound += min;
					}
				}
			}
		}
		if( size == 2 ) {
		////System.out.println("#####\nsize"+size);
		//System.out.println(Arrays.toString(cities));
		//System.out.println(Arrays.toString(blocked));
		//System.out.println("lb "+lowerBound);
		}
	}
	public long cost(){
		return lowerBound;
		/*long cost = 0;
		for (int i = 0; i < size; i++) {
			cost += TSP.c.cost(cities[i], cities[(i+1)%size]);
		}
		return cost;*/
		
	}
	
	public void setLevel (int level) {
		this.level = level;
	}
	public void setCities (byte[] cities) {
		this.cities = cities;
	}
	// Queries
	public int size () {
		return size;
	} 

	public byte [] cities() {
		return cities;
	}
	public int level () {
		return level;
	}
	public long lowerBound() {
		return lowerBound;
	}
	public int compareTo (Object obj) {
		if (this == obj) {
			return 0;
		}
		Node other = (Node) obj;
		if (size < other.size) {
			return 1;
		} else if (size > other.size) {
			return -1;
		} else if (size == other.size) {
			if (lowerBound < other.lowerBound) {
				return -1;
			} else if (lowerBound > other.lowerBound) {
				return 1;
			} else if (lowerBound == other.lowerBound) {
				// Add up the sum of the cities
				int sumThis = 0;
				for (int i = 0; i < size; i++) {
					sumThis += cities[i];
				}
				int sumOther = 0;
				for (int i = 0; i < size; i++) {
					sumOther += other.cities[i];
				}
				if (sumThis <= sumOther) {
					return -1;
				} else if (sumThis > sumOther) {
					return 1;
				}
			}
		}
		return 100;
	}

	public boolean equals (Object obj) {
		return this.compareTo(obj) == 0;
	}
	public String toString () {
		String result = "<";
		for (int i = 0; i < cities.length; i++) {
			result += cities[i] + " ";
		}
		if (cities.length == TSP.numRows) {
			for (int i = 0; i < TSP.numRows; i++) {
				if (!present((byte) i, cities)) { 

					result += i + " ";
					break;
				}
			}
			result += "0>";
		} else {
			result += ">";
		}
		return result;
	}
	private long minimum (int index) {
		long smallest = Long.MAX_VALUE;
		for (int col = 0; col < TSP.numRows; col++) {
			if (col != index && !blocked[col] &&
					TSP.c.cost(index, col) < smallest) {
				smallest = TSP.c.cost(index, col);
			}
		}
		return smallest;
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