up:
	docker-compose up -d

stop:
	docker-compose stop

down:
	docker-compose down -v

shell:
	docker-compose exec ci /bin/sh
