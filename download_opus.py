import urllib.request
import os

url = "https://github.com/xiph/opus/releases/download/v1.3.1/opus-tools-1.3-win64.zip"
output = "D:\\bot\\opus_temp.zip"

try:
    print("Downloading opus...")
    urllib.request.urlretrieve(url, output)
    print(f"Downloaded to {output}")
    
    import zipfile
    with zipfile.ZipFile(output, 'r') as zip_ref:
        zip_ref.extractall("D:\\bot\\opus_extract")
    print("Extracted opus files")
    
    # Try to find opus DLL
    for root, dirs, files in os.walk("D:\\bot\\opus_extract"):
        for file in files:
            if 'opus' in file.lower() and file.endswith('.dll'):
                print(f"Found: {os.path.join(root, file)}")
                
except Exception as e:
    print(f"Error: {e}")
