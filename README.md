# Aldeias Infantis SOS  

Crie uma aplicação web completa chamada "ConectaBairro".
OBJETIVO DO PRODUTO
O ConectaBairro é uma plataforma comunitária voltada para moradores de um mesmo território, com foco inicial em:
1. Vaquinhas comunitárias
2. Doações de alimentos e roupas
3. Sistema de pontuação e reputação comunitária
4. Cadastro de animais de estimação
5. Pets desaparecidos
6. Cadastro de prestadores de serviços
7. Demandas comunitárias
8. Futuramente, rede comunitária de câmeras
A plataforma deve possuir uma interface moderna, responsiva, simples e adequada principalmente para uso em celulares.
A prioridade do produto é SOLIDARIEDADE E PARTICIPAÇÃO COMUNITÁRIA.
==================================================
STACK
==================================================
Utilizar:
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)
- arquitetura preparada para integração futura com APIs de IA
Não criar dados fictícios permanentes no banco.
Utilizar componentes reutilizáveis.
==================================================
TIPOS DE USUÁRIO
==================================================
Existem dois níveis principais:
1. SUPER ADMIN
2. USUÁRIO/MORADOR
SUPER ADMIN possui acesso total.
USUÁRIO possui acesso somente aos próprios dados e aos dados públicos permitidos.
==================================================
AUTENTICAÇÃO
==================================================
Criar sistema completo de autenticação utilizando Supabase Auth.
Tela de login:
- E-mail
- Senha
- Entrar
- Esqueci minha senha
- Criar conta
Tela de cadastro:
- Nome completo
- E-mail
- Telefone
- Senha
- Confirmação de senha
- CEP
- Rua
- Número da residência
- Complemento
- Bairro
- Cidade
- Estado
Antes de concluir o cadastro, o sistema deve verificar se já existe um usuário principal associado à mesma residência.
REGRA FUNDAMENTAL:
UMA RESIDÊNCIA = UM USUÁRIO PRINCIPAL.
Não permitir dois usuários principais para o mesmo endereço/número de residência dentro da mesma comunidade.
O sistema deve normalizar o endereço antes de verificar duplicidade.
Criar um identificador único de residência.
Exemplo conceitual:
residence_id
Cada usuário principal possui exatamente uma residence_id.
Se já existir usuário principal naquela residence_id:
"Esta residência já possui um cadastro principal. Caso você seja morador desta residência, solicite ao responsável pelo cadastro que adicione você como dependente."
==================================================
DEPENDENTES
==================================================
O usuário principal poderá cadastrar dependentes/membros da residência.
Exemplos:
- esposa
- marido
- filho
- filha
- pai
- mãe
- avó
- avô
- outro
Tabela:
household_members
Campos:
- id
- residence_id
- user_id
- name
- relationship
- birth_date opcional
- phone opcional
- email opcional
- active
- created_at
O usuário principal é o responsável pela residência.
Inicialmente, dependentes não precisam possuir login próprio.
Preparar arquitetura para futuramente permitir login individual vinculado à mesma residência.
==================================================
PERFIL DO MORADOR
==================================================
Criar dashboard do usuário.
Exibir:
- nome
- residência
- pontuação
- nível comunitário
- quantidade de doações
- quantidade de contribuições em vaquinhas
- campanhas criadas
- pets cadastrados
- pets desaparecidos
- solicitações realizadas
- histórico de atividades
==================================================
SISTEMA DE PONTUAÇÃO
==================================================
Criar sistema de gamificação comunitária.
O usuário recebe pontos por ações positivas.
Exemplos:
Criar vaquinha:
+50 pontos
Contribuir para vaquinha:
+20 pontos
Doar alimento:
+30 pontos
Doar roupa:
+20 pontos
Doação concluída:
+50 pontos
Cadastrar pet:
+5 pontos
Ajudar em campanha comunitária:
+30 pontos
Confirmar recebimento de doação:
+10 pontos
Realizar ação comunitária validada pelo administrador:
+50 pontos
IMPORTANTE:
Não permitir que o usuário simplesmente clique várias vezes para ganhar pontos.
Toda pontuação deve estar vinculada a uma ação registrada no banco.
Criar tabela:
points_transactions
Campos:
- id
- user_id
- action_type
- points
- reference_id
- description
- created_at
Criar tabela de configuração:
point_rules
Campos:
- id
- action_type
- points
- active
O Super Admin poderá alterar a pontuação de cada ação.
==================================================
NÍVEIS
==================================================
Criar níveis comunitários baseados na pontuação.
Exemplo:
0-99:
Novo Morador
100-299:
Participante
300-599:
Colaborador
600-999:
Parceiro Comunitário
1000+:
Embaixador Comunitário
Os nomes e faixas devem ser configuráveis pelo Super Admin.
Mostrar barra de progresso:
"Você possui 420 pontos.
Faltam 180 pontos para Parceiro Comunitário."
Não criar ranking público inicialmente.
O objetivo é incentivar colaboração, não competição excessiva.
==================================================
MÓDULO 1 — VAQUINHAS
==================================================
Este é o módulo PRIORITÁRIO.
Criar área:
"Vaquinhas"
Permitir:
- visualizar campanhas
- pesquisar
- filtrar
- criar campanha
- contribuir
- acompanhar progresso
- visualizar atualizações
- encerrar campanha
Cada campanha deve possuir:
- id
- title
- description
- image
- goal_amount
- current_amount
- creator_id
- status
- start_date
- end_date
- category
- created_at
Categorias:
- Saúde
- Alimentação
- Evento comunitário
- Infraestrutura
- Animais
- Educação
- Solidariedade
- Outros
STATUS:
- Rascunho
- Em análise
- Ativa
- Concluída
- Cancelada
- Encerrada
Toda nova vaquinha deve passar por análise do Super Admin antes de ficar pública.
==================================================
CONTRIBUIÇÕES
==================================================
Criar tabela:
campaign_contributions
Campos:
- id
- campaign_id
- user_id
- amount
- status
- created_at
Status:
- pending
- confirmed
- cancelled
No MVP, criar estrutura preparada para pagamento.
Não implementar carteira financeira própria.
Preparar integração futura com gateway de pagamento.
O valor arrecadado deve ser atualizado somente quando a contribuição estiver confirmada.
Não permitir que usuários alterem manualmente o valor arrecadado.
==================================================
TRANSPARÊNCIA DAS VAQUINHAS
==================================================
Cada campanha deve possuir:
- meta
- arrecadado
- percentual
- quantidade de apoiadores
- atualizações
- status
- responsável
- histórico
Criar barra de progresso.
Exemplo:
R$ 2.350 / R$ 5.000
47%
==================================================
MÓDULO 2 — DOAÇÕES
==================================================
Criar seção:
"Doações"
Prioridade inicial:
- Alimentos
- Roupas
Permitir cadastrar:
- título
- categoria
- descrição
- quantidade
- unidade
- foto
- condição
- validade quando aplicável
- disponibilidade
- região aproximada
Categorias de alimentos:
- cesta básica
- arroz
- feijão
- leite
- macarrão
- alimentos não perecíveis
- outros
Categorias de roupas:
- infantil
- masculino
- feminino
- bebê
- calçados
- outros
Não exibir publicamente o endereço residencial exato do doador.
Mostrar apenas região/bairro.
==================================================
SOLICITAÇÃO DE DOAÇÃO
==================================================
Usuário poderá solicitar uma doação.
Criar:
donation_requests
Campos:
- id
- donation_id
- requester_id
- message
- status
- created_at
Status:
- pending
- approved
- rejected
- completed
- cancelled
O doador poderá aceitar uma solicitação.
Após confirmação da entrega:
- marcar doação como concluída
- registrar histórico
- atribuir pontos aos envolvidos conforme regras configuradas.
==================================================
MÓDULO 3 — PETS
==================================================
Criar seção:
"Meus Pets"
O morador poderá cadastrar seus animais.
Campos:
- nome
- espécie
- raça
- sexo
- data de nascimento
- porte
- cor
- foto principal
- fotos adicionais
- características
- possui microchip
- número do microchip opcional
- observações
- contato de emergência opcional
Espécies:
- cachorro
- gato
- ave
- outro
Criar tabela:
pets
Campos:
- id
- owner_user_id
- name
- species
- breed
- sex
- birth_date
- size
- color
- photo_url
- microchip
- notes
- active
- created_at
==================================================
MÓDULO 4 — PETS DESAPARECIDOS
==================================================
Criar área pública:
"Pets Desaparecidos"
Qualquer morador autenticado poderá registrar um pet desaparecido.
Campos:
- pet_id opcional
- nome
- espécie
- raça
- foto
- características
- último local visto
- data
- horário aproximado
- observações
- telefone para contato
- status
Status:
- Desaparecido
- Encontrado
- Encerrado
Criar mapa com localização aproximada do desaparecimento.
NÃO exibir endereço residencial do proprietário.
Exibir:
"Último local visto: região X"
Permitir que moradores informem:
"Avistamento"
Criar tabela:
pet_sightings
Campos:
- id
- missing_pet_id
- reporter_user_id
- description
- approximate_location
- photo_url
- created_at
O proprietário poderá receber notificações sobre novos avistamentos.
==================================================
MÓDULO 5 — PRESTADORES
==================================================
Criar:
"Prestadores de Serviço"
Categorias:
- eletricista
- encanador
- pedreiro
- pintor
- diarista
- informática
- mecânico
- cabeleireiro
- manicure
- cuidador
- entregador
- outros
Perfil:
- nome
- categoria
- descrição
- telefone
- WhatsApp
- foto
- bairro
- horário
- status
Permitir avaliações.
Não afirmar que um profissional é "confiável" automaticamente.
Criar sistema de denúncias e moderação.
==================================================
MÓDULO 6 — DEMANDAS COMUNITÁRIAS
==================================================
Criar:
"Demandas do Bairro"
Categorias:
- iluminação
- infraestrutura
- limpeza
- meio ambiente
- acessibilidade
- trânsito
- segurança percebida
- outros
Permitir:
- título
- descrição
- foto
- localização aproximada
- categoria
- status
Status:
- registrada
- em análise
- em andamento
- resolvida
- arquivada
==================================================
MÓDULO 7 — RELATOS CONFIDENCIAIS
==================================================
Criar área:
"Relato Confidencial"
O usuário autenticado poderá enviar um relato.
A identidade do usuário NÃO deve ser exibida publicamente.
Não chamar isso de anonimato absoluto.
Criar proteção de acesso via RLS.
Somente usuários autorizados do Super Admin poderão visualizar informações administrativas.
Não criar sistema de investigação policial.
Não permitir acusações públicas contra indivíduos.
==================================================
MÓDULO 8 — DASHBOARD DO SUPER ADMIN
==================================================
Criar área administrativa completamente separada.
URL conceitual:
/admin
Somente usuários com role = super_admin podem acessar.
Dashboard:
- total de moradores
- residências
- dependentes
- doações
- vaquinhas
- valores arrecadados
- prestadores
- pets
- pets desaparecidos
- demandas
- relatos
- campanhas
==================================================
SUPER ADMIN
==================================================
O Super Admin pode:
- visualizar usuários
- bloquear usuários
- editar usuários
- visualizar residências
- gerenciar dependentes
- aprovar/reprovar vaquinhas
- editar campanhas
- cancelar campanhas
- moderar doações
- moderar prestadores
- moderar pets desaparecidos
- moderar demandas
- visualizar relatos confidenciais
- configurar pontuação
- configurar categorias
- configurar níveis
- visualizar logs
- alterar status de conteúdo
- visualizar métricas
Criar tabela:
user_roles
Campos:
- id
- user_id
- role
Roles:
- user
- super_admin
IMPORTANTE:
Nunca confiar apenas na interface para autorização.
Implementar autorização também no banco usando Supabase RLS e políticas adequadas.
==================================================
AUDITORIA
==================================================
Criar tabela:
audit_logs
Registrar ações administrativas:
- quem executou
- ação
- entidade
- entity_id
- data
- informações relevantes
O Super Admin poderá consultar os logs.
==================================================
NOTIFICAÇÕES
==================================================
Criar sistema de notificações.
Exemplos:
- vaquinha aprovada
- contribuição confirmada
- doação solicitada
- doação aceita
- doação concluída
- pet desaparecido atualizado
- novo avistamento
- demanda atualizada
- campanha encerrada
- pontos recebidos
==================================================
PRIVACIDADE
==================================================
Tratar endereço residencial como dado privado.
Não exibir publicamente:
- número da casa
- endereço completo
- telefone pessoal sem autorização
- e-mail
- dados dos dependentes
O mapa deve trabalhar com localização aproximada quando necessário.
Não expor dados pessoais em páginas públicas.
Implementar RLS no Supabase.
==================================================
DESIGN
==================================================
Interface moderna, limpa e comunitária.
Mobile-first.
Menu principal:
🏠 Início
💰 Vaquinhas
🤝 Doações
🛠️ Serviços
🐾 Pets
📍 Demandas
👤 Meu Perfil
No dashboard:
Pontuação do usuário
"Você tem 350 pontos"
Mostrar nível atual e progresso.
Criar cards visualmente claros.
==================================================
HOME
==================================================
A página inicial deve destacar:
"Como podemos ajudar o bairro hoje?"
Cards:
💰 Criar ou apoiar uma vaquinha
🤝 Doar
🛠️ Encontrar um profissional
🐾 Pets desaparecidos
📍 Ver demandas
Criar seção:
"Campanhas em destaque"
"Doações disponíveis"
"Pets desaparecidos próximos"
"Prestadores do bairro"
==================================================
BANCO DE DADOS
==================================================
Criar migrations/tabelas necessárias para:
profiles
residences
household_members
user_roles
point_rules
points_transactions
campaigns
campaign_contributions
donations
donation_requests
service_providers
service_reviews
community_demands
confidential_reports
pets
missing_pets
pet_sightings
notifications
audit_logs
Criar relacionamentos e foreign keys.
Criar índices apropriados.
Criar RLS.
==================================================
SEED
==================================================
Criar somente dados de demonstração claramente identificados como DEMO.
Não misturar dados demo com produção.
==================================================
IMPORTANTE
==================================================
Não construir inicialmente:
- reconhecimento facial
- reconhecimento de placas
- vigilância automática
- monitoramento individual
- carteira financeira própria
- sistema bancário
- acesso automático de autoridades às câmeras
O módulo de câmeras deve ficar preparado arquiteturalmente para uma futura versão, mas não deve ser prioridade do MVP.
==================================================
RESULTADO ESPERADO
==================================================
Entregar uma aplicação funcional, responsiva e navegável.
Prioridade de implementação:
1. Autenticação
2. Residências e usuários
3. Dashboard
4. Vaquinhas
5. Doações
6. Sistema de pontos
7. Pets
8. Pets desaparecidos
9. Prestadores
10. Demandas
11. Relatos confidenciais
12. Super Admin
13. Notificações
14. Auditoria
Garantir que cada módulo tenha:
- loading state
- empty state
- error state
- validação de formulário
- feedback visual
- controle de acesso
- tratamento de erros
- responsividade
Antes de finalizar, verificar todos os fluxos de autenticação, autorização, criação, edição, exclusão, aprovação e moderação.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bond-the-block.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ce7c7523-ae7d-4b2f-aaac-55c659441c29).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
