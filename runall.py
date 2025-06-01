import subprocess
import os
import glob
import time
import signal

# Path to your Java source files folder
root_project = os.getcwd()
java_source_folder = os.path.join(root_project, "bigboss_rmi")
backend_source_folder = os.path.join(root_project, "bigboss-backend")
client = os.path.join(root_project, "index.html")

# Command to compile all .java files in that folder
java_files = glob.glob(os.path.join(java_source_folder, "*.java"))

print("Files to compile:")
for f in java_files:
    print(f)

# Build javac command as list
command = ["javac", "-encoding", "utf-8"] + java_files

# Run the command
result = subprocess.run(command, capture_output=True, text=True)

if result.returncode == 0:
    print("Compilation succeeded!")
    print(result.stdout)
else:
    print("Compilation failed.")
    print("Error output:", result.stderr)

# === 2. Start Java GymServer ===
print("Starting Java GymServer...")
java_classpath = f"{java_source_folder};{root_project}"  # Windows classpath separator ';'
gym_server_cmd = ["java", "-cp", java_classpath, "bigboss_rmi.GymServer"]

# Start GymServer as a background process
gym_server_proc = subprocess.Popen(gym_server_cmd, cwd=root_project, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

# Optional: wait some seconds to ensure server starts
time.sleep(5)

# Check if GymServer started without immediate error
if gym_server_proc.poll() is not None:
    out, err = gym_server_proc.communicate()
    print("GymServer failed to start!")
    print("STDOUT:", out)
    print("STDERR:", err)
    exit(1)
print("GymServer started successfully!")

# === 3. Start Node.js backend server ===
print("Starting Node.js backend server...")
node_cmd = ["nodemon", "server.js"]  # or the entrypoint file of your backend

node_proc = subprocess.Popen(node_cmd, cwd=backend_source_folder, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

# Optional: wait some seconds to ensure backend starts
time.sleep(5)

if node_proc.poll() is not None:
    out, err = node_proc.communicate()
    print("Node.js backend failed to start!")
    print("STDOUT:", out)
    print("STDERR:", err)
    # Clean up GymServer before exiting
    gym_server_proc.terminate()
    exit(1)
print("Node.js backend server started successfully!")


# === Keep servers running until user interrupts ===
try:
    print("Servers are running. Press Ctrl+C to stop.")
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Stopping servers...")

# Cleanup processes gracefully
gym_server_proc.terminate()
node_proc.terminate()
gym_server_proc.wait()
node_proc.wait()
print("All servers stopped.")