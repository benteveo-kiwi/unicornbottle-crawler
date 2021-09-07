"""
This standalone script uses playwright codegen to create a base login script,
which is then modified using AI-powered advanced heuristics.

It will spawn a browser in the URL you specify, at which point you need to
login. After you login you should click on an element which you think both a)
will only appear when you are logged in and b) won't change between logins.
This will be used to differentiate between successful and failed logins by the
crawler/fuzzer.

Additionally you should stop recording before closing the browser otherwise it
will create a broken script.
"""

import os
import subprocess
import sys

class ReplacementFailed(Exception):
    pass

if len(sys.argv) < 3:
    print("[-] Usage: python3 generator.py <LOGIN_SCRIPT_NAME> <Initial URL>")
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
            raise ReplacementFailed("Could not find string %s in file %s." % (old_string, filename))

    with open(filename, 'w') as f:
        s = s.replace(old_string, new_string)
        f.write(s)

output_js_file = name + '.js'
storage_name = name + '.storage'
if os.path.exists(output_js_file):
    print("[-] %s already exists. Exiting." % output_js_file)
    sys.exit()

cmd = ['npx', 'playwright', 'codegen', '--target', 'javascript', '-o', output_js_file, '--save-storage', storage_name, initial_url]
process = subprocess.Popen(cmd)
process.wait()

# Perform advanced AI-powered heuristic code transformations. :)
replace_in_file(output_js_file, "headless: false", "headless: true")
replace_in_file(output_js_file, storage_name + "'", "' + process.argv[2]")

