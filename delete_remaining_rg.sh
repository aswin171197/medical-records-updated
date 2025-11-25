#!/bin/bash

az appservice plan delete --name ASP-medicalrecordappgroup-b410 --resource-group medical-record-app_group --yes

az group delete --name medical-record-app_group --yes