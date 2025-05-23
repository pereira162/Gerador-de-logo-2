import os
from datetime import datetime

IGNORAR_PASTAS = {".git", "dist", "ARQUIVOS", ".github", "node_modules", "__pycache__"}
IGNORAR_ARQUIVOS = {"exportar_tudo.py", "exportar_alterados.py", "mapear_arquivos.py"}
IGNORAR_PREFIXOS = ("mapa_", "alterados_")

# Data/hora para o nome do arquivo
agora = datetime.now()
timestamp_str = agora.strftime("%d-%m_%H-%M")
cabecalho_str = agora.strftime("Data de exportação: %d/%m às %H:%M")
nome_arquivo = f"mapa_completo_{timestamp_str}.txt"

# 1. Mapeamento dos arquivos
all_files = []
for root, dirs, files in os.walk("."):
    dirs[:] = [d for d in dirs if d not in IGNORAR_PASTAS]
    for file in files:
        if (
            file in IGNORAR_ARQUIVOS
            or any(file.startswith(prefixo) for prefixo in IGNORAR_PREFIXOS)
        ):
            continue
        caminho = os.path.join(root, file)
        if caminho.startswith("./"):
            caminho = caminho[2:]
        all_files.append(caminho)

# 2. Escrever no arquivo de saída
erros = []

with open(nome_arquivo, "w", encoding="utf-8") as out:
    out.write(f"{cabecalho_str}\n")
    out.write("Mapeamento completo de arquivos (com pastas e subpastas):\n")
    for idx, caminho in enumerate(sorted(all_files), 1):
        out.write(f"{idx}. {caminho}\n")
    out.write("\n\n")

    for idx, caminho in enumerate(sorted(all_files), 1):
        out.write(f"--- [{idx}] {caminho} ---\n")
        try:
            with open(caminho, "r", encoding="utf-8") as f:
                out.write(f.read())
        except Exception as e:
            out.write(f"[Erro ao ler o arquivo: {e}]\n")
            erros.append(caminho)
        out.write("\n\n")

if erros:
    print("\nOs seguintes arquivos tiveram erro ao serem processados:")
    for erro in erros:
        print(f"- {erro}")
    input("\nPressione Enter para continuar...")
else:
    print("\nTodos os arquivos foram processados corretamente!")
    input("\nPressione Enter para sair...")