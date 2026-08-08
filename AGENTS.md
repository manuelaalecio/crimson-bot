# CRIMSON - Rules, Architecture & Constraints (`AGENTS.md`)

Este documento especifica estritamente as restrições arquiteturais, padrões de implementação e limites de execução para qualquer modificação na codebase do bot **CRIMSON**.

---

## REGRAS CRÍTICAS DE "NÃO PODE" (NÃO FAÇA EM HIPÓTESE ALGUMA)

### 1. Invasão de Escopo e Segurança

* **NÃO escreva credenciais ou IDs explicitamente no código:** Qualquer token, webhook, ID de guilda ou ID de canal DEVE ser lido estritamente via `process.env`.
* **NÃO faça commit de arquivos `.env` ou secrets.**
* **NÃO utilize comandos de prefixo legados:** A arquitetura aceita EXCLUSIVAMENTE **Slash Commands** (`/`). É proibido escutar `messageCreate` para processar comandos de texto.

### 2. Padrões de Código & TypeScript

* **NÃO utilize `any`:** É estritamente proibido o uso de `any`. Se o tipo for incerto, use `unknown` com asserção de tipos (*type guards* ou `instanceof`).
* **NÃO ignore erros com `catch {}` vazios:** Todo erro interceptado DEVE ser registrado via `console.error()` com o contexto da operação.
* **NÃO use TypeScript com desativação de verificações estritas:** `strict: true` no `tsconfig.json` é obrigatório.
* **NÃO utilize bibliotecas de terceiros para funcionalidades nativas:** Não instale pacotes adicionais para funções que o `discord.js` já resolve nativamente.

### 3. Execução Assíncrona e Performance

* **NÃO use chamadas síncronas bloqueantes no Event Loop:** Proibido usar `fs.readFileSync`, `execSync` ou loops síncronos pesados dentro de listeners de eventos.
* **NÃO estoure o tempo limite de resposta do Discord (3 segundos):** Operações que demandem tempo (banco de dados, fetchs externos) DEVEM invocar `await interaction.deferReply()` imediatamente.

---

## REGRAS OBRIGATÓRIAS DE "DEVE FAZER" (SEMPRE APLIQUE)

### 1. Arquitetura Modular (Event & Command Handlers)

* **Separação Rígida de Arquivos:** Cada comando deve ser um módulo individual dentro de `src/commands/<categoria>/`. Cada evento deve ser um módulo em `src/events/`.
* **Registro Automático:** O ponto de entrada (`src/index.ts`) deve carregar e registrar eventos e comandos dinamicamente varrendo os diretórios.

### 2. Validação e Type Checking de Canais

* **Validação de Instância:** Sempre valide a existência e o tipo do canal antes de emitir mensagens ou manipular estados:
```typescript
if (!channel || !channel.isTextBased() || channel.isDMBased()) return;

```



### 3. Tratamento de Permissões

* **Verificação Dupla de Permissão:** Antes de executar qualquer ação administrativa, verifique se o **membro** possui a permissão e se o **próprio bot** (`guild.members.me`) possui permissão para executar o ato no canal/guilda.

### 4. Respostas Efêmeras por Padrão

* **Manutenção da Limpeza do Chat:** Todas as confirmações de ações administrativas (ban, kick, purge, warn) enviadas no canal do comando DEVEM ser efêmeras (`flags: MessageFlags.Ephemeral`), a menos que o comando exija explicitamente uma resposta pública.

---

## ARQUITETURA DO PROJETO

### Árvore de Diretórios

```text
src/
├── @types/          # Definições de tipos customizados e interfaces
├── commands/        # Comandos organizados por categoria
│   ├── admin/       # Comandos restritos a administradores
│   ├── moderation/  # Comandos de moderação (kick, ban, clear)
│   └── utility/     # Comandos utilitários (ping, info, user)
├── events/          # Event Listeners (ready, messageDelete, guildMemberAdd)
├── structures/      # Classes base (CustomClient, CommandBuilder, etc.)
├── utils/           # Funções utilitárias auxiliares e formatadores
├── config.ts        # Carregamento e validação de variáveis de ambiente
└── index.ts         # Inicialização do client e ponto de entrada

```

---

## PADRÕES DE IMPLEMENTAÇÃO

### Interface de Comando (`src/@types/command.ts`)

```typescript
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionResolvable 
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

```

### Modelo Padrão de Slash Command (`src/commands/moderation/clear.ts`)

```typescript
import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  PermissionFlagsBits, 
  TextChannel,
  MessageFlags
} from 'discord.js';
import { Command } from '../../@types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('limpar')
    .setDescription('Apaga uma quantidade específica de mensagens do canal.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Número de mensagens a serem apagadas (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  
  botPermissions: [PermissionFlagsBits.ManageMessages],

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const amount = interaction.options.getInteger('quantidade', true);
      const channel = interaction.channel;

      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        await interaction.reply({ 
          content: 'Este comando só pode ser executado em canais de texto de um servidor.', 
          flags: MessageFlags.Ephemeral 
        });
        return;
      }

      const textChannel = channel as TextChannel;
      const deletedMessages = await textChannel.bulkDelete(amount, true);

      await interaction.reply({
        content: `${deletedMessages.size} mensagens foram removidas com sucesso.`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error(`Erro ao executar o comando /limpar por ${interaction.user.tag}:`, error);
      
      const errorMessage = 'Ocorreu um erro ao tentar apagar as mensagens.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    }
  }
};

```

---

## PADRÃO DE DESIGN (EMBEDS)

Todas as Embeds devem seguir uma paleta estrita de cores numéricas hexadecimais:

* **Crimson / Principal:** `0xdc143c` (Uso geral, boas-vindas, info)
* **Erro / Perigo:** `0xff0000` (Erros, logs de exclusão, banimentos)
* **Sucesso / Moderação:** `0x00ff7f` (Ações aplicadas com sucesso)
* **Alerta / Warning:** `0xffa500` (Avisos, logs de edição de mensagem)

**Regra para Embeds de Log:** Sempre anexar `.setTimestamp()` e definir o *footer* padronizado como `"CRIMSON System Logs"`.