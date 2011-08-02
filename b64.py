import base64, sys

filename = sys.argv[1] 
filetype = sys.argv[2]

f = open("tmp_b64/%s.tid"%filename, "w")
lines = base64.b64encode(open("src/%s"%filename,"rb").read())
for line in ["type: %s\n"%filetype, "tags: excludeLists excludeSearch takenote\n\n"]:
  f.write(line)

for line in lines:
  f.write(line)
f.close()
