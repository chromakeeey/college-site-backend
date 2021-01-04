install:
	docker-compose -f docker-compose.builder.yml run --rm install
bash:
	docker-compose -f docker-compose.builder.yml run --rm bash
mysql-cli:
	docker exec -it college-site-backend_mysql_1 mysql -u user -ppassword database
mysql-cli-root:
	docker exec -it college-site-backend_mysql_1 mysql -u root -ppassword database
redis-cli:
	docker exec -it college-site-backend_redis_1 redis-cli
dev:
	docker-compose up
clean:
	docker-compose rm -f
	docker volume prune -f
