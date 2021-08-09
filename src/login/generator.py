import os
import subprocess
import sys

if len(sys.argv) < 3:
    print("[-] Usage: python3 generator.py <NAME> <Initial URL>")
    sys.exit()
else:
    name = sys.argv[1]
    initial_url = sys.argv[2]

def replace_in_file(filename, old_string, new_string):
    """
    Replaces all instances of old_string to new_string in filename.
    """
    with open(filename) as f:
        s = f.read()
        if old_string not in s:
            return

    with open(filename, 'w') as f:
        s = s.replace(old_string, new_string)
        f.write(s)

output_js_file = name + '.js'
if os.path.exists(output_js_file):
    print("[-] %s already exists. Exiting." % output_js_file)
    sys.exit()

cmd = ['npx', 'playwright', 'codegen', '--target', 'javascript', '-o', output_js_file, '--save-storage', name + '.storage', initial_url]
process = subprocess.Popen(cmd)
process.wait()

replace_in_file(output_js_file, "headless: false", "headless: true")


