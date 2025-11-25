#!/bin/bash

az group delete --name medical-record-backend --yes
az group delete --name medical-record-frontend --yes
az group delete --name medical-record-app_group --yes
az group delete --name backend-medical --yes
az group delete --name backend --yes