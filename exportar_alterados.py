import subprocess
from datetime import datetime
import os

IGNORAR_PASTAS = {".git", "dist", "ARQUIVOS", ".github", "node_modules", "__pycache__"}
IGNORAR_ARQUIVOS = {"exportar_tudo.py", "exportar_alterados.py", "mapear_arquivos.py"}
IGNORAR_PREFIXOS = ("mapa_", "alterados_")

agora = datetime.now()
timestamp_str = agora.strftime("%d-%m_%H-%M")
cabecalho_str = agora.strftime("Data de exportação: %d/%m às %H:%M")
nome_arquivo = f"alterados_{timestamp_str}.txt"

# 1. Obter arquivos alterados/adicionados com separador nulo
result = subprocess.run(
    ["git", "status", "--porcelain", "-z"],
    capture_output=True, text=True
)
entries = result.stdout.strip('\0').split('\0')
arquivos = []
for entry in entries:
    if not entry:
        continue
    status = entry[:2].strip()
    path = entry[3:] if entry[2] == ' ' else entry[2:]
    if (
        status in ['A', 'M', 'AM', '??']
        and path not in IGNORAR_ARQUIVOS
        and not any(path.startswith(prefixo) for prefixo in IGNORAR_PREFIXOS)
    ):
        arquivos.append(path)

# 2. Criar mapeamento dos arquivos
mapeamento = []
for idx, arquivo in enumerate(arquivos, 1):
    mapeamento.append(f"{idx}. {arquivo}")

# 3. Escrever no arquivo de saída
with open(nome_arquivo, "w", encoding="utf-8") as out:
    out.write(f"{cabecalho_str}\n")
    out.write("Mapeamento de arquivos alterados/adicionados:\n")
    out.write("\n".join(mapeamento))
    out.write("\n\n")

    # Novo: Mapa de todos os arquivos com pastas e subpastas
    out.write("Mapeamento completo de arquivos (com pastas e subpastas):\n")
    all_files = []
    IGNORAR_PASTAS = {".git", "dist", "ARQUIVOS", ".github", "node_modules"}
    for root, dirs, files in os.walk("."):
        # Remove as pastas a serem ignoradas da lista de diretórios
        dirs[:] = [d for d in dirs if d not in IGNORAR_PASTAS]
        for file in files:
            caminho = os.path.join(root, file)
            # Remove o './' do início para ficar mais limpo
            if caminho.startswith("./"):
                caminho = caminho[2:]
            all_files.append(caminho)
    for idx, caminho in enumerate(sorted(all_files), 1):
        out.write(f"{idx}. {caminho}\n")
    out.write("\n\n")

    for idx, arquivo in enumerate(arquivos, 1):
        out.write(f"--- [{idx}] {arquivo} ---\n")
        try:
            with open(arquivo, "r", encoding="utf-8") as f:
                out.write(f.read())
        except Exception as e:
            out.write(f"[Erro ao ler o arquivo: {e}]\n")
        out.write("\n\n")