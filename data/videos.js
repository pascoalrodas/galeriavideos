import { normalizarSrc } from '../lib/iframe.js';

// Catálogo inicial. Entra no banco uma única vez; depois a galeria usa a tabela videos.
const videos = [
  { titulo: 'Magrinha dando cuzinho gostozinho', src: 'https://www.xvideos.com/embedframe/kaukaibad30' },
  { titulo: 'Estorou o cu da magrinha', src: 'https://www.xvideos.com/embedframe/khdtcvf9a2c' },
  { titulo: 'Com força anal', src: 'https://www.xvideos.com/embedframe/kvmeeab66d4' },
  { titulo: 'Anal em pe', src: 'https://www.xvideos.com/embedframe/ifdumom8515' },
  { titulo: 'Barulhinho', src: 'https://www.xvideos.com/embedframe/hboookb2003' },
  { titulo: 'Ai meu cu', src: 'https://www.xvideos.com/embedframe/uduiuem09f3' },
  { titulo: 'Hardcore é a mais ampla das categorias de pornografia', src: 'https://www.xnxx.com/embedframe/uflcedff8c9' },
  { titulo: 'Sexy ebony especial torna-se Hardcore ANAL', src: 'https://www.xnxx.com/embedframe/iovfhfu0a52' },
  { titulo: 'Bastidores com a ninfeta Bibi Sadomasoquista - Cena completa no Red', src: 'https://www.xnxx.com/embedframe/oodfcmad0d2' },
  { titulo: 'Título do Segundo Vídeo', src: 'https://www.xvideos.com/embedframe/uduiuem09f3' },
  { titulo: 'Agarrei a novinha de bruços e comi o cu até encher de porra - Gaucholuiz e Santinha Safadinha', src: 'https://www.xvideos.com/embedframe/uteeftm8d90' },
  { titulo: 'Por favor, goze, dói! A pequena loira leva uma bunda fodida de Wicked Fellow', src: 'https://www.xvideos.com/embedframe/kdamlbv5ad7' },
  { titulo: 'Carter Cruise amarrado e fudido anal por Mr Pete NO MERCY', src: 'https://www.xvideos.com/embedframe/kamumid1cf0' },
  { titulo: 'O Melhor Orgasmo Anal', src: 'https://www.xvideos.com/embedframe/fthcid4544' },
  { titulo: 'Arrombando o cu da novinha com consolo gigante', src: 'https://www.xvideos.com/embedframe/hphbbao2553' },
  { titulo: 'faz anal e leva gozada dentro do cu', src: 'https://www.xvideos.com/embedframe/ududduv491d' },
  { titulo: 'Sexo em grupo com um flexível', src: 'https://www.xnxx.com/embedframe/uclmfhm6b5a' },
  { titulo: 'Total extremo anal busto aberto', src: 'https://www.xnxx.com/embedframe/ulplvvf545f' },
  { titulo: 'extreme-deep-anal-fisting', src: 'https://www.xnxx.com/embedframe/hlumc083' },
  { titulo: 'Latina quente anal', src: 'https://www.xnxx.com/embedframe/ikcfuodd7ee' },
  { titulo: 'Punho profundo no cotovelo e barriga protuberante lésbica', src: 'https://www.xnxx.com/embedframe/okiliahe04c' },
  { titulo: 'Eu implorando pra ele gozar no meu cu', src: 'https://www.xvideos.com/embedframe/himlhpkfa7d' },
  { titulo: 'A foda anal dura acabou com um boquete desleixado nele e um tiro no rosto em mim', src: 'https://www.xvideos.com/embedframe/kubobhk0e74' },
  { titulo: 'A melhor hora que eu fodi na minha bunda!', src: 'https://www.xvideos.com/embedframe/umddkfh1172' },
  { titulo: 'Cuzinho e pagodinho', src: 'https://www.xvideos.com/embedframe/iemfufv3b40' },
  { titulo: 'Agachando com Buttplug', src: 'https://www.xvideos.com/embedframe/itopmhbd099' },
  { titulo: 'Fodendo o cu da milf com força até ela gozar pela bunda', src: 'https://www.xvideos.com/embedframe/udpuubd4054' },
  { titulo: 'Menina asiática', src: 'https://www.xvideos.com/embedframe/luufuo7670' },
  { titulo: 'O cu da empregada venezuelana ficou todo aberto e pingando porra, ela disse que adorou e queria fazer novamente', src: 'https://www.xvideos.com/embedframe/ooplmmoa945' },
  { titulo: 'Ela queria que sua primeira vez fosse inesquecível e até foderam a cabeça dela pelo buraco errado', src: 'https://www.xnxx.com/embedframe/udadkfk7a2d' }
];

for (const video of videos) {
  if (!video.titulo || normalizarSrc(video.src) !== video.src) {
    throw new Error('Entrada inválida na lista de vídeos.');
  }
}

export default videos;
