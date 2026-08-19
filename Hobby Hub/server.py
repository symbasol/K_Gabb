# ============================================
#  Double-Click Local Web Server (Python)
#  Opens browser automatically
#  URL: http://localhost:8765/
# ============================================

import http.server
import socketserver
import os
import webbrowser
import tkinter as tk

PORT = 8765

# Serve the directory where this script is located
root = os.path.dirname(os.path.abspath(__file__))
os.chdir(root)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"{self.command} {self.path}")

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}/")
        webbrowser.open(f"http://localhost:{PORT}/")
        httpd.serve_forever()

# GUI window so double-click doesn't close instantly
window = tk.Tk()
window.title("Hobby Hub Server")
window.geometry("300x120")

label = tk.Label(window, text="Hobby Hub is running!\nClose this window to stop the server.")
label.pack(pady=20)

# Start server in background
import threading
threading.Thread(target=start_server, daemon=True).start()

window.mainloop()
