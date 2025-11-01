
docker compose exec tidb bash -lc "yum install -y mysql"

for i in $(seq 1 500); do
    name="matan$i"
    email="matan$i@test.com"
    docker compose exec tidb mysql -htidb -u root -P4000 -e "INSERT INTO helify_cdc_demo.users (name, email) VALUES ('$name', '$email');"
done