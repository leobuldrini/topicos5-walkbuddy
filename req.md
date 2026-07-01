Requisitos de um Software Baseado em IA

Alunos: Arthur Castro, Leonardo Buldrini, Vinícius Tavares, Wanderson Pessoa

Contextualização do Projeto
O Walk Buddy é um software baseado em inteligência artificial, acessível via web, cujo objetivo é conectar tutores de pets a passeadores de forma mais segura, eficiente e compatível. O diferencial do sistema está no uso de um mecanismo de recomendação inteligente, capaz de sugerir combinações adequadas entre tutor, pet e passeador a partir de critérios como localização, disponibilidade, porte e comportamento do animal, experiência do passeador, faixa de preço e histórico de avaliações.

Considerando o prazo fixo de entrega até 28/06/2026, o projeto foi delimitado como um MVP web, com foco em funcionalidades essenciais e em um modelo de recomendação viável para implementação acadêmica.

Convergências e Divergências entre as Ferramentas de IA
Para realização da listagem de requisitos funcionais e não funcionais foram utilizadas 4 IA 's diferentes, sendo elas, Claude, Copilot, Chat GPT e Google Gemini. A partir do refinamento dos requisitos gerados por elas foi possível alinhar suas convergências.

A análise comparativa das listas geradas pelas diferentes ferramentas de IA evidenciou forte convergência em relação ao núcleo funcional do sistema. Em geral, houve consenso quanto à necessidade de cadastro e autenticação de usuários, diferenciação entre os perfis de tutor e passeador, cadastro de pets, solicitação e aceite de passeios, histórico de passeios, sistema de avaliações e área administrativa básica.




Também houve convergência nos requisitos não funcionais essenciais, especialmente em relação à responsividade da interface, segurança de autenticação, persistência e integridade dos dados, organização modular do código, compatibilidade com navegadores modernos e documentação mínima do sistema.

As principais divergências ocorreram no nível de complexidade atribuído ao MVP. Algumas propostas incluíram funcionalidades mais ambiciosas, como pagamento real, chat em tempo real, rastreamento contínuo por GPS e aplicação mobile nativa. Outras priorizaram uma abordagem mais enxuta, com pagamento simulado, notificações simples, atualização manual de status e foco em uma aplicação web responsiva.

Além disso, observou-se uma lacuna comum: embora o Walk Buddy seja definido como software baseado em IA, as listas iniciais não detalhavam suficientemente os requisitos do mecanismo de recomendação. Por esse motivo, a consolidação final incorporou requisitos específicos para o componente de recomendação inteligente.

Lista Final de Requisitos Funcionais
RF01. O sistema deve permitir o cadastro e login de usuários por e-mail e senha.

RF02. O sistema deve permitir que o usuário atue como tutor, passeador ou ambos.

RF03. O tutor deve poder cadastrar, editar e remover um ou mais pets, informando nome, porte, raça, idade, comportamento e observações relevantes.

RF04. O passeador deve poder cadastrar e editar seu perfil profissional, incluindo foto, biografia, experiência, valor base por passeio, região de atendimento e disponibilidade.

RF05. O sistema deve permitir ao tutor visualizar passeadores disponíveis em sua região.

RF06. O tutor deve poder solicitar um passeio informando pet, data, horário, duração estimada e local ou região.

RF07. O sistema deve apresentar ao passeador as solicitações compatíveis com sua disponibilidade e área de atendimento.

RF08. O passeador deve poder aceitar ou recusar solicitações de passeio.

RF09. O sistema deve registrar e exibir o status do passeio, contemplando ao menos os estados: solicitado, aceito, em andamento, concluído e cancelado.

RF10. Tutor e passeador devem poder cancelar um passeio antes do início, com registro do motivo.

RF11. O sistema deve manter histórico de passeios para ambos os perfis.

RF12. Após a conclusão do passeio, o tutor deve poder avaliar o passeador com nota e comentário.

RF13. Após a conclusão do passeio, o passeador deve poder avaliar o tutor ou o pet com nota e comentário.

RF14. O sistema deve exibir no perfil do passeador sua média de avaliações.

RF15. O sistema deve calcular um valor estimado do passeio com base em critérios simples definidos pela aplicação.

RF16. O sistema deve registrar o pagamento de forma simulada, sem integração obrigatória com gateway real no MVP.

RF17. O sistema deve enviar notificações simples sobre eventos relevantes, como aceite, cancelamento, início e conclusão do passeio.

RF18. O sistema deve disponibilizar uma área administrativa web para visualização de usuários, passeios, denúncias e avaliações.

RF19. O sistema deve permitir que tutor e passeador denunciem usuários por comportamento inadequado.

RF20. O passeador deve poder visualizar um resumo simples de passeios concluídos e ganhos estimados.

RF21. O sistema deve gerar uma lista ranqueada de passeadores recomendados para cada solicitação de passeio feita pelo tutor.

RF22. A recomendação deve considerar, no mínimo, localização, disponibilidade, porte do pet, comportamento do pet, experiência do passeador, faixa de preço e histórico de avaliações.

RF23. O sistema deve exibir ao tutor os principais critérios que justificam cada recomendação, promovendo transparência no uso da IA.

RF24. O sistema deve recalcular as recomendações quando houver alteração de informações relevantes da solicitação.

RF25. O sistema deve registrar interações com as recomendações para permitir evolução futura do mecanismo de IA.

RF26. O sistema não deve recomendar passeadores indisponíveis no horário solicitado ou incompatíveis com o perfil do pet.

RF27. O sistema deve recomendar ao passeador oportunidades de passeio compatíveis com seu perfil, sua disponibilidade e sua área de atendimento.

RF28. O sistema deve permitir o uso de dados contextuais externos, quando viável, para enriquecer as recomendações e apoiar a decisão do usuário.

Lista Final de Requisitos Não Funcionais
RNF01. O sistema deve ser acessível publicamente por meio de navegador web.

RNF02. A interface deve ser responsiva e utilizável em desktop e dispositivos móveis.

RNF03. As operações principais devem responder em até 3 segundos em condições normais de uso.

RNF04. O sistema deve armazenar senhas com hash seguro e exigir autenticação para acesso às funcionalidades protegidas.

RNF05. O sistema deve garantir persistência, integridade e consistência dos dados.

RNF06. O sistema deve registrar ações relevantes, como cadastro, aceite, cancelamento, conclusão, avaliação e geração de recomendações.

RNF07. A arquitetura deve possuir separação clara entre frontend, backend e módulo de recomendação.

RNF08. O código deve ser organizado de forma modular, favorecendo manutenção, testes e evolução futura.

RNF09. O sistema deve ser compatível com versões recentes dos principais navegadores.

RNF10. O projeto deve possuir documentação mínima, incluindo instruções de execução, arquitetura, modelo de dados e endpoints principais.

RNF11. O sistema deve tratar erros de maneira compreensível para o usuário.

RNF12. O sistema deve seguir princípios básicos de proteção de dados e privacidade.

RNF13. Dados sensíveis devem possuir acesso restrito conforme o perfil do usuário.

RNF14. A interface deve seguir princípios básicos de acessibilidade, como contraste adequado, textos legíveis e identificação clara de campos e botões.

RNF15. O sistema deve ser implementável e demonstrável até 28/06/2026, priorizando funcionalidades essenciais e evitando dependências de alta complexidade.

RNF16. O módulo de recomendação deve produzir resultados consistentes e explicáveis.

RNF17. O sistema deve permitir evolução futura do mecanismo de recomendação sem necessidade de reestruturação completa da aplicação.

RNF18. O ambiente de implantação deve ser reproduzível para fins de demonstração acadêmica.




Justificativa do Recorte do MVP
O recorte adotado busca equilíbrio entre valor funcional, uso de inteligência artificial e viabilidade de entrega. Por essa razão, foram priorizadas as funcionalidades essenciais ao fluxo principal do sistema: cadastro, gestão de perfis, cadastro de pets, solicitação e aceite de passeios, histórico, avaliações, administração básica e recomendação inteligente.

Em contrapartida, funcionalidades que aumentariam significativamente a complexidade técnica do projeto, como pagamento real, chat em tempo real, rastreamento contínuo por GPS e desenvolvimento de aplicativo nativo, não foram definidas como prioridade para o MVP. Essa decisão preserva a coerência com o modelo de timeboxing e reduz o risco de comprometimento do cronograma.

Relato da Prática de AI4RE
A prática de AI4RE foi empregada como apoio ao processo de Engenharia de Requisitos do Walk Buddy. O grupo utilizou múltiplas ferramentas de inteligência artificial para gerar listas independentes de requisitos funcionais e não funcionais a partir de um mesmo contexto de projeto.

Na etapa inicial, as ferramentas produziram propostas distintas de escopo e detalhamento. Em seguida, o grupo realizou uma análise comparativa das respostas, identificando convergências, divergências e lacunas. As convergências foram tratadas como indicativos de requisitos essenciais do domínio. As divergências foram analisadas com base em critérios de viabilidade, complexidade técnica, prazo e aderência ao objetivo do projeto. As lacunas, por sua vez, foram tratadas por meio de refinamento manual, especialmente no que se refere ao componente de recomendação por IA.

Na etapa de consolidação, foi elaborada uma lista final unificada, combinando os requisitos recorrentes e acrescentando requisitos específicos para a inteligência artificial do sistema. Esse processo permitiu equilibrar amplitude de cobertura e realismo de implementação.

A experiência demonstrou que o uso de IA pode contribuir de forma significativa para a elicitação e organização inicial de requisitos, ampliando perspectivas e acelerando a construção de alternativas. Entretanto, também evidenciou que as respostas geradas exigem análise crítica, validação contextual e curadoria humana, sobretudo quando o projeto possui restrições rígidas de prazo e escopo.

Dessa forma, a prática de AI4RE não se limitou à geração automática de listas, mas envolveu um processo iterativo de comparação, síntese, refinamento e consolidação, orientado pelas necessidades concretas do projeto.



Conclusão
A versão final dos requisitos do Walk Buddy foi definida com base em critérios de viabilidade, coerência técnica e aderência ao propósito do sistema como software baseado em IA. O resultado é um conjunto de requisitos compatível com o prazo acadêmico, suficientemente robusto para demonstrar valor funcional e, ao mesmo tempo, centrado no diferencial do projeto: a recomendação inteligente de passeadores e oportunidades de passeio.
