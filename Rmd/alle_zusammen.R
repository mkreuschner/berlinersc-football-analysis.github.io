# Lade notwendige Pakete
library(rmarkdown)

# Definiere eine Liste von Teams oder Variablen für unterschiedliche Berichte
teams <- c(
  "Berliner SC II", 
  "Berliner SV 1892", 
  "Concordia Britz",
  "BFC Preussen II", 
  "BFC Meteor 06", 
  "FC Internationale 1980",
  "FC Viktoria 1899 II", 
  "TSV Rudow Berlin", 
  "SV Stern Britz",
  "BSV Eintrach Mahlsdorf II", 
  "Berolina Stralau", 
  "Köpenicker FC",
  "BSV Al-Dersimspor",
  "SV Empor Berlin II",
  "Türkiyemspor Berlin",
  "SC Borsigwalde 1910"
  )

# For-Schleife, um mehrere .Rmd-Dateien zu erstellen und auszuführen
for (team in teams) {
  
  # Generiere dynamisch den Inhalt für die .Rmd-Datei
  rmd_content <- paste0(
    "---\n",
    "title: 'Analyse für ", team, "'\n",
    "output: html_document\n",
    "---\n\n",
    "```{r setup, include=FALSE}\n",
    "knitr::opts_chunk$set(echo = TRUE)\n",
    "library(ggplot2)\n",
    "library(dplyr)\n",
    "selected_team <- '", team, "'\n",
    "```\n\n",
    "# Analyse für ", team, "\n\n",
    "Hier folgt eine spezifische Analyse für das Team: **", team, "**.\n\n",
    "```{r plot, echo=FALSE}\n",
    "# Beispiel-Plot für das Team\n",
    "ggplot(data.frame(x = 1:10, y = rnorm(10)), aes(x, y)) + \n",
    "  geom_line() + \n",
    "  labs(title = paste('Beispiel-Plot für', selected_team))\n",
    "```\n"
  )
  
  # Speichere den Inhalt als .Rmd-Datei
  rmd_file <- paste0(team, ".Rmd")
  writeLines(rmd_content, con = rmd_file)
  
  # Render die .Rmd-Datei in ein HTML-Format
  render(input = rmd_file, output_format = "html_document",
         output_file = paste0(team, ".html"))
}

# Hinweis:
# Nach der Schleife sollten für jedes Team eine `.Rmd`- und eine `.html`-Datei erstellt worden sein.
