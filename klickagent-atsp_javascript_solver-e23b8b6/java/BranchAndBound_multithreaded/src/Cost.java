
public class Cost {

	private long[][] costMatrix;
	
	public Cost(int numCols, int numRows){
		costMatrix = new long[numRows][];
		for( int i = 0; i < numRows; i++ ){
			costMatrix[i] = new long[numRows];
		}
		
	}
	
	
	public void assignCost( long value, int row, int col){
		costMatrix[row][col] = value;
	}
	
	
	public long cost(int row,int col){
		return costMatrix[row][col];
	}
	
}
