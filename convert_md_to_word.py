#!/usr/bin/env python3
"""
Convert Markdown Testing Manual to Styled Word Document
Usage: python convert_md_to_word.py
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
import re

def create_styled_document():
    """Create a new Word document with custom styles"""
    doc = Document()
    
    # Set default font
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    
    # Create custom styles
    
    # Title style
    if 'CustomTitle' not in doc.styles:
        title_style = doc.styles.add_style('CustomTitle', WD_STYLE_TYPE.PARAGRAPH)
        title_style.font.name = 'Calibri'
        title_style.font.size = Pt(24)
        title_style.font.bold = True
        title_style.font.color.rgb = RGBColor(0, 51, 102)  # Dark blue
        title_style.paragraph_format.space_after = Pt(12)
        title_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Heading 1 style (with emoji removed)
    if 'CustomHeading1' not in doc.styles:
        h1_style = doc.styles.add_style('CustomHeading1', WD_STYLE_TYPE.PARAGRAPH)
        h1_style.font.name = 'Calibri'
        h1_style.font.size = Pt(18)
        h1_style.font.bold = True
        h1_style.font.color.rgb = RGBColor(0, 112, 192)  # Blue
        h1_style.paragraph_format.space_before = Pt(18)
        h1_style.paragraph_format.space_after = Pt(12)
    
    # Heading 2 style
    if 'CustomHeading2' not in doc.styles:
        h2_style = doc.styles.add_style('CustomHeading2', WD_STYLE_TYPE.PARAGRAPH)
        h2_style.font.name = 'Calibri'
        h2_style.font.size = Pt(16)
        h2_style.font.bold = True
        h2_style.font.color.rgb = RGBColor(68, 114, 196)  # Light blue
        h2_style.paragraph_format.space_before = Pt(14)
        h2_style.paragraph_format.space_after = Pt(10)
    
    # Heading 3 style
    if 'CustomHeading3' not in doc.styles:
        h3_style = doc.styles.add_style('CustomHeading3', WD_STYLE_TYPE.PARAGRAPH)
        h3_style.font.name = 'Calibri'
        h3_style.font.size = Pt(14)
        h3_style.font.bold = True
        h3_style.font.color.rgb = RGBColor(0, 0, 0)
        h3_style.paragraph_format.space_before = Pt(12)
        h3_style.paragraph_format.space_after = Pt(8)
    
    # Code block style
    if 'CustomCode' not in doc.styles:
        code_style = doc.styles.add_style('CustomCode', WD_STYLE_TYPE.PARAGRAPH)
        code_style.font.name = 'Consolas'
        code_style.font.size = Pt(9)
        code_style.paragraph_format.left_indent = Inches(0.5)
        code_style.paragraph_format.space_before = Pt(6)
        code_style.paragraph_format.space_after = Pt(6)
    
    # Checkbox style
    if 'CustomCheckbox' not in doc.styles:
        checkbox_style = doc.styles.add_style('CustomCheckbox', WD_STYLE_TYPE.PARAGRAPH)
        checkbox_style.font.name = 'Calibri'
        checkbox_style.font.size = Pt(11)
        checkbox_style.paragraph_format.left_indent = Inches(0.3)
    
    return doc

def remove_emojis(text):
    """Remove emoji characters from text"""
    # Remove common emojis used in the document
    emoji_pattern = re.compile("["
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
        "]+", flags=re.UNICODE)
    
    text = emoji_pattern.sub('', text)
    
    # Remove specific emoji patterns
    text = text.replace('📋', '').replace('🎯', '').replace('🔐', '')
    text = text.replace('👥', '').replace('📅', '').replace('🎫', '')
    text = text.replace('✅', '').replace('📊', '').replace('⚙️', '')
    text = text.replace('🔄', '').replace('🐛', '').replace('📝', '')
    text = text.replace('💡', '').replace('🚀', '').replace('⭐', '')
    text = text.replace('✨', '').replace('⚠️', '').replace('❌', '')
    text = text.replace('✓', '[✓]').replace('⏱', '[Late]').replace('✗', '[✗]')
    
    return text.strip()

def parse_markdown_to_word(md_file, output_file):
    """Parse markdown file and convert to styled Word document"""
    doc = create_styled_document()
    
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_code_block = False
    code_language = ''
    skip_separator = False
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Skip separator lines
        if line.startswith('# ═══════'):
            skip_separator = True
            i += 1
            continue
        
        if skip_separator and line.strip() == '':
            skip_separator = False
            i += 1
            continue
        
        # Handle code blocks
        if line.startswith('```'):
            in_code_block = not in_code_block
            if in_code_block:
                code_language = line[3:].strip()
            i += 1
            continue
        
        if in_code_block:
            p = doc.add_paragraph(line, style='CustomCode')
            p.paragraph_format.left_indent = Inches(0.5)
            i += 1
            continue
        
        # Handle headings
        if line.startswith('# ') and not line.startswith('# ═'):
            text = remove_emojis(line[2:])
            doc.add_paragraph(text, style='CustomTitle')
        elif line.startswith('## '):
            text = remove_emojis(line[3:])
            doc.add_paragraph(text, style='CustomHeading1')
        elif line.startswith('### '):
            text = remove_emojis(line[4:])
            doc.add_paragraph(text, style='CustomHeading2')
        elif line.startswith('#### '):
            text = remove_emojis(line[5:])
            doc.add_paragraph(text, style='CustomHeading3')
        
        # Handle horizontal rules
        elif line.startswith('---') or line.startswith('==='):
            doc.add_paragraph('_' * 80)
        
        # Handle checkboxes
        elif '[ ]' in line or '[x]' in line or '[X]' in line:
            text = remove_emojis(line)
            text = text.replace('[ ]', '☐').replace('[x]', '☑').replace('[X]', '☑')
            doc.add_paragraph(text, style='CustomCheckbox')
        
        # Handle bold text with **
        elif '**' in line:
            text = remove_emojis(line)
            p = doc.add_paragraph()
            parts = text.split('**')
            for idx, part in enumerate(parts):
                if idx % 2 == 0:
                    p.add_run(part)
                else:
                    p.add_run(part).bold = True
        
        # Handle tables
        elif line.startswith('|') and '|' in line:
            # Collect table rows
            table_rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = lines[i].strip()
                if not all(c in '|-: ' for c in row.replace('|', '')):
                    cells = [cell.strip() for cell in row.split('|')[1:-1]]
                    table_rows.append(cells)
                i += 1
            
            if table_rows:
                # Create table
                table = doc.add_table(rows=len(table_rows), cols=len(table_rows[0]))
                table.style = 'Light Grid Accent 1'
                
                for row_idx, row_data in enumerate(table_rows):
                    for col_idx, cell_data in enumerate(row_data):
                        cell = table.rows[row_idx].cells[col_idx]
                        cell.text = remove_emojis(cell_data)
                        
                        # Bold header row
                        if row_idx == 0:
                            for paragraph in cell.paragraphs:
                                for run in paragraph.runs:
                                    run.bold = True
                
                doc.add_paragraph()  # Add space after table
            continue
        
        # Handle regular paragraphs
        elif line.strip():
            text = remove_emojis(line)
            doc.add_paragraph(text)
        
        # Handle empty lines
        else:
            if i > 0 and lines[i-1].strip():  # Only add space if previous line had content
                doc.add_paragraph()
        
        i += 1
    
    # Save document
    doc.save(output_file)
    print(f"✓ Document saved: {output_file}")
    print(f"✓ File size: {round(os.path.getsize(output_file) / 1024 / 1024, 2)} MB")

if __name__ == '__main__':
    import os
    
    # Input and output files
    input_file = 'TESTING_MANUAL_LENGKAP_COMBINED.md'
    output_file = 'TESTING_MANUAL_LENGKAP_COMBINED.docx'
    
    print("=" * 60)
    print("MARKDOWN TO WORD CONVERTER")
    print("=" * 60)
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print("=" * 60)
    
    if not os.path.exists(input_file):
        print(f"✗ Error: File '{input_file}' not found!")
        print(f"  Current directory: {os.getcwd()}")
        exit(1)
    
    try:
        print("Converting...")
        parse_markdown_to_word(input_file, output_file)
        print("=" * 60)
        print("✓ CONVERSION COMPLETE!")
        print("=" * 60)
        print(f"\nYou can now open '{output_file}' in Microsoft Word")
        print("The document is ready to print with proper styling.")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
