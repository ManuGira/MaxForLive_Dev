function loadjsonfile(filename){
	f = new File(filename, "read", []);
	jsonstr = f.readstring(f.eof);
	f.close();
	prs = JSON.parse(jsonstr);
	return prs; 
}