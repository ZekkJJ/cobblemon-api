import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, unquote
import time

# URL de la wiki de Cobblemon
WIKI_URL = "https://wiki.cobblemon.com/index.php/Pok%C3%A9_Ball"
BASE_URL = "https://wiki.cobblemon.com"

# Directorio donde se guardarán los modelos
OUTPUT_DIR = "pokeball_models"

def scrape_pokeball_models():
    """
    Scrape la página de Poké Balls y descarga todos los modelos 3D
    """
    # Crear directorio de salida si no existe
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"✓ Directorio '{OUTPUT_DIR}' creado")
    
    # Realizar la petición HTTP
    print(f"Descargando página: {WIKI_URL}")
    response = requests.get(WIKI_URL)
    response.raise_for_status()
    
    # Parsear el HTML
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Encontrar todas las imágenes que contengan "model" en el alt o src
    model_images = []
    
    # Buscar todas las imágenes
    all_images = soup.find_all('img')
    
    for img in all_images:
        alt = img.get('alt', '')
        src = img.get('src', '')
        
        # Filtrar solo las imágenes de modelos
        if 'model' in alt.lower() or 'model' in src.lower():
            model_images.append({
                'alt': alt,
                'src': src,
                'width': img.get('data-file-width', img.get('width', 'unknown')),
                'height': img.get('data-file-height', img.get('height', 'unknown'))
            })
    
    print(f"\n✓ Se encontraron {len(model_images)} modelos de Poké Balls")
    print("-" * 60)
    
    # Descargar cada modelo
    downloaded = 0
    for idx, img_data in enumerate(model_images, 1):
        try:
            # Construir URL completa
            img_url = urljoin(BASE_URL, img_data['src'])
            
            # Extraer nombre del archivo del alt o src
            filename = img_data['alt']
            if not filename:
                filename = os.path.basename(unquote(img_data['src']))
            
            # Limpiar el nombre del archivo
            filename = filename.replace('(model).png', '').strip()
            if not filename.endswith('.png'):
                filename += '_model.png'
            
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # Descargar la imagen
            print(f"[{idx}/{len(model_images)}] Descargando: {filename}")
            print(f"    URL: {img_url}")
            
            img_response = requests.get(img_url)
            img_response.raise_for_status()
            
            # Guardar la imagen
            with open(filepath, 'wb') as f:
                f.write(img_response.content)
            
            print(f"    ✓ Guardado como: {filepath}")
            print(f"    Dimensiones: {img_data['width']}x{img_data['height']}")
            downloaded += 1
            
            # Pequeña pausa para no saturar el servidor
            time.sleep(0.5)
            
        except Exception as e:
            print(f"    ✗ Error descargando {img_data['alt']}: {str(e)}")
    
    print("-" * 60)
    print(f"\n✓ Descarga completada: {downloaded}/{len(model_images)} modelos descargados")
    print(f"✓ Archivos guardados en: {os.path.abspath(OUTPUT_DIR)}")
    
    # Mostrar resumen de modelos encontrados
    print("\n" + "=" * 60)
    print("RESUMEN DE MODELOS ENCONTRADOS:")
    print("=" * 60)
    for img_data in model_images:
        print(f"• {img_data['alt']}")
    print("=" * 60)

if __name__ == "__main__":
    try:
        scrape_pokeball_models()
    except Exception as e:
        print(f"\n✗ Error general: {str(e)}")
        import traceback
        traceback.print_exc()
