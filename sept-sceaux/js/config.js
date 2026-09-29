// Codes personnels acceptés, sous forme d'empreintes SHA-256 du code normalisé
// (majuscules, sans tiret ni espace). Les codes en clair sont dans le coffre privé
// Notes : mini-jeux/Sept Sceaux - MJ.md. Ne jamais écrire un code en clair ici.
window.SCEAUX_CONFIG = {
  codes: [
    { h: '14face4b2511fcf4ed46e72bd726c1f7679d62ac49a88ed40509fba1e69ead67' },
    { h: 'da93fac240efb297ed41e73608bde09e5b1a5e0811999bb42bb0703cdf1e99be' },
    { h: '80ac7e488d5ed2a8e137267e474014e52b0cee6167c4fc83dd0e9e596b294dc2' },
    { h: 'e89ec60318e119fc76eda109f693d41cbe32109f2e44282d0547fa74fb31578c' },
    { h: '6caea53f70f0303ca73a69f9e8cd5cda3c0f388c335c525d19d030ce12406a60' }, // invité (remplace l'ancien code de Koma, un PNJ)
    { h: 'aa67b580ac8ce0067777ee5d2b0287e5a11e1c629053e4e06d3d8da2711ddcea' },
    { h: '4c8470bfb005c55e5bb0c52617deac2df9367dd728e05a9b648306bd90b99296' },
    { h: 'd5f8848eed507fb8d2f2eabc07e84f4c3ba2622ab8ade955e4e2f192dcad87c9' },
    { h: 'fe2b2b6b4570392165255d402a609af11095afdb33a89d7c66c7673ae6ba04e5', mj: true }
  ],
  // Énigmes partagées : pour ces codes (empreintes), le sceau indiqué est généré à partir
  // d'une graine commune, donc identique pour plusieurs joueurs qui peuvent le résoudre
  // ensemble. Kagé et la Fée BD : même sceau III (demande du MJ).
  graines: {
    '14face4b2511fcf4ed46e72bd726c1f7679d62ac49a88ed40509fba1e69ead67': { 3: 'duo-kage-fee' },
    'd5f8848eed507fb8d2f2eabc07e84f4c3ba2622ab8ade955e4e2f192dcad87c9': { 3: 'duo-kage-fee' }
  },
  // Clés du gardien des épreuves des Profondeurs (même règle d'empreinte), par identifiant.
  solutionsProfondeurs: {
    clans: '0ee758773ed970e963cdfa6c139e924fa8295d23f39bf59937d9b377a1f0db44',
    tapisserie: 'dd2890b9a365ce7691a9cdaad9bf149439630e3ea8582f220e4eed196993eb37',
    ponts: '5a77616f0303c478e77daa7c57b9645c140b6e56e788ad0662ba5afae967cff0',
    lanternes: '87fec1f1729fed676dc9f7efec22c0a61731f8650bb8d9ce312455181c7dec46',
    glaces: 'beabf7432bcf3ef757bd7ccc4a7cb4e991f176cc315a8abcc75c668c455b77ff'
  },
  // Clés du gardien des jeux bonus qui en ont une.
  solutionsBonus: {
    chambres: 'e4f1f25d915e5db31098475c318d14ca297db2b6e88dc72d5ffaa12e1bc89a3d'
  },
  // Un code par sceau pour afficher sa solution (et pourquoi c'est la bonne), même règle d'empreinte.
  solutions: {
    1: '9037ef2f7f4ccc24577c92685019dd959c5329c2cd2fe497f3c2af850f84b320',
    2: '326c96f29cd8b8bea938e9700b2da1f0ee9b6447d7fa8dd347c4e6a0271e47b8',
    3: '813f7c1ed0bad5ae03b9b8eda9b501b558e56b84996de4d8653d052a32f7e7f7',
    4: 'd38bd239a09917e39ebb2488093b39f6cd3c87a0685c342aab42064b89e68e00',
    5: 'b4636b8394a154eb149909e86784e9eba4f071d70cdc7fd63e2319078bb6f4b9',
    6: 'f9daba97bcf42127826a72ec8721c608d9870ee18d9a0726943b5a44607e0479',
    7: 'dbec28d7ed216cfd0815660b9a1b52385cdba6b73e760326220ce8512449734f'
  }
};
