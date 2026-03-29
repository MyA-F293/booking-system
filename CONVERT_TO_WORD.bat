@echo off
echo ============================================================
echo MARKDOWN TO WORD CONVERTER
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python tidak ditemukan!
    echo.
    echo Silakan install Python terlebih dahulu:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python ditemukan
echo.

REM Check if python-docx is installed
python -c "import docx" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Library python-docx belum terinstall
    echo [INFO] Installing python-docx...
    echo.
    pip install python-docx
    echo.
)

echo [OK] Library python-docx tersedia
echo.

REM Check if input file exists
if not exist "TESTING_MANUAL_LENGKAP_COMBINED.md" (
    echo [ERROR] File TESTING_MANUAL_LENGKAP_COMBINED.md tidak ditemukan!
    echo.
    echo Pastikan Anda menjalankan script ini di folder booking-system
    echo.
    pause
    exit /b 1
)

echo [OK] File Markdown ditemukan
echo.
echo ============================================================
echo CONVERTING...
echo ============================================================
echo.

REM Run the conversion script
python convert_md_to_word.py

echo.
echo ============================================================
echo SELESAI!
echo ============================================================
echo.

REM Check if output file was created
if exist "TESTING_MANUAL_LENGKAP_COMBINED.docx" (
    echo [SUCCESS] File Word berhasil dibuat!
    echo.
    echo File: TESTING_MANUAL_LENGKAP_COMBINED.docx
    echo.
    echo Anda sekarang bisa:
    echo 1. Buka file Word untuk review
    echo 2. Print langsung dari Word
    echo 3. Export ke PDF jika perlu
    echo.
    
    REM Ask if user wants to open the file
    set /p OPEN="Buka file Word sekarang? (Y/N): "
    if /i "%OPEN%"=="Y" (
        start TESTING_MANUAL_LENGKAP_COMBINED.docx
    )
) else (
    echo [ERROR] File Word gagal dibuat!
    echo Cek error message di atas.
    echo.
)

echo.
pause
