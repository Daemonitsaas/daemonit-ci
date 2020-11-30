FROM node:12-alpine

USER root
RUN mkdir -p /usr/src/app && \
	chown node: /usr/src/app && \
	rm -fr /tmp/*

USER node
WORKDIR /usr/src/app

COPY index.js ./
COPY package.json ./
COPY yarn.lock ./

RUN yarn install --no-dev && \
	rm -rf /tmp/*

ENV DAEMONIT_URL=''
ENV DAEMONIT_ENGINE_ID='15'
ENV DAEMONIT_API_USER=''
ENV DAEMONIT_API_PASS=''

WORKDIR /usr/src/app
CMD ["node", "index.js"]
