package util;


public class TimeInterval {
   
	private static long start;
	private static long elapsed;
	private static boolean stopped;
	
    public void startTiming() {
    	internalStartTiming();
    	stopped = false;
    }
    
    public void endTiming() {
    	internalEndTiming();
    }
    
    private static void internalStartTiming() {
       start = new Long(System.currentTimeMillis());
       
       
    }
 
    private static long internalEndTiming() {
        long now = System.currentTimeMillis();
       
        long elapsed = now-start;       
        return elapsed;
    }
    
    public long getElapsedTime(){
    	if(!stopped){
    		elapsed = internalEndTiming();
    	}
    	return elapsed;
    }
 
}
