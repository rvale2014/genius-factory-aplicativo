## SETUP E COMANDOS ##

1) Rodar o app: 
**COMANDO** : npx expo start

2) Versão do EAS CLI: 
**COMANDO** : npx eas-cli --version

3) Verificar login no EAS CLI: 
**COMANDO** : npx eas-cli whoami

4) Gerar Build de desenvolvimento: 
**COMANDO** : npx eas-cli build --profile development --platform android  

* O EAS faz o "empacotamento" do app para Android e envia para os servidores da Expo na nuvem. Lá ele gera o arquivo .apk que pode ser instalado em qualquer dispositivo Android. Ao final do processo, ele gera um link para download do arquivo .apk.
* Depois de feito o build de desenvolvimento, ele deve ser instalado no Emulador (arrastar o arquivo .apk para a janela do emulador). Ele também pode ser instalado em um dispositivo físico Android.
* As mudanças no código já são refletidas imediatamente no build de desenvolvimento (mudanças em telas, componentes, estilos, lógica Javascript). O que não se altera em tempo real é a instalação de uma nova biblioteca, mudanças nas configurações em app.config.ts e alteração de arquivos nativos na pasta android/. Nesses casos, é preciso gerar um novo build.

5) Gerar Build de Preview:
**COMANDO** : npx eas-cli build --profile preview --platform android

* Faz sentido quando você quer testar sem o PC ligado ou quer enviar para alguém testar.
* Faz sentido quando você quer testar performance real. O build de desenvolvimento é mais lento porque carrega o código via rede. O build de preview é mais rápido porque tem o Javascript embutido e otimizado, então a performance é mais próxima da produção. 
* O .apk do preview permite a criação de apps internos, que não serão enviados para a Play Store. 
* Para atualizar um app interno, basta fazer EAS Update, rodando npx eas-cli update. 

6) Gerar Build de Produção:
**COMANDO** : npx eas-cli build --profile production --platform android

* O build de produção é o que será enviado para a Google Play Store. Ele é otimizado para performance e tamanho.
* O build de produção gera um arquivo .aab (Android App Bundle). A Google Play não aceita mais arquivos .apk para publicação; ela exige o formato .aab.





