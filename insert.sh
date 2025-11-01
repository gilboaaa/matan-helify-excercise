for i in $(seq 1 500); do
    name=(cat /dev/urandom | tr -dc 'a-zA-Z' | fold -w 6 | head -n 1)
    email="$name$i@test.com"

    docker compose exec tidb mysql -u root -h localhost -P4000 -e "INSERT INTO helify_cdc_demo.users (name, email) VALUES ('$name', '$email');"