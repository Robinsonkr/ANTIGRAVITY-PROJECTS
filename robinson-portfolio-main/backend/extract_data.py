from bs4 import BeautifulSoup
import os

def extract_text_from_html(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return ""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style elements
    for script_or_style in soup(["script", "style", "nav", "footer"]):
        script_or_style.decompose()
        
    # Get text
    text = soup.get_text(separator='\n')
    
    # Break into lines and remove leading/trailing whitespace
    lines = (line.strip() for line in text.splitlines())
    # Break multi-headlines into a line each
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # Drop blank lines
    text = '\n'.join(chunk for chunk in chunks if chunk)
    
    return text

def main():
    base_dir =os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    index_path = os.path.join(base_dir, 'index.html')
    resume_path = os.path.join(base_dir, 'resume.html')
    
    knowledge_base = ""
    knowledge_base += "PORTFOLIO CONTENT:\n" + extract_text_from_html(index_path) + "\n\n"
    knowledge_base += "RESUME CONTENT:\n" + extract_text_from_html(resume_path)
    
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'knowledge_base.txt')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(knowledge_base)
        
    print(f"Knowledge base created at: {output_path}")

if __name__ == "__main__":
    main()
