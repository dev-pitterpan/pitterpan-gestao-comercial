# Base cartográfica do mapa mundial

- Fonte: Natural Earth, camada `ne_110m_admin_0_countries.geojson`, escala 1:110m.
- Repositório: https://github.com/nvkelso/natural-earth-vector
- Arquivo: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson
- Blob consultado em 24/11/2026: `1e6ab74c7042f97013be69ceec798be8e1aff27d`.
- Licença original: domínio público. https://github.com/nvkelso/natural-earth-vector/blob/master/LICENSE.md

`src/shared/lib/admin/world-countries.json` contém somente o código de país, o nome em português e os contornos projetados. Coordenadas usam projeção equiretangular, com `x=(longitude+180)*2.4` e `y=(84-latitude)*2.4`, arredondadas para uma casa decimal. A Antártida foi omitida para a visualização comercial horizontal. Territórios pequenos podem não ter contorno nesta escala e continuam listados nos resultados, com indicação da quantidade fora do desenho. Entidades sem código ISO da fonte permanecem como contorno neutro.

A base descreve a geografia; os destaques, quantidades e classificações vêm exclusivamente dos pedidos sincronizados. O desenho não contém endereços ou dados de clientes e não usa tiles ou geocodificação externa.
