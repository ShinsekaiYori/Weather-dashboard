import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import ReactPlayer from "react-player";
import "./App.css";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  List,
  ListItem,
  useColorMode,
  Container,
  Flex,
  Image,
  FormControl,
  IconButton,
} from "@chakra-ui/react";
import { SunIcon, MoonIcon } from "@chakra-ui/icons";

const API_KEY = process.env.REACT_APP_API_KEY;

function App() {
  const [city, setCity] = useState("");
  const [forecastData, setForecastData] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState(null);
  const { colorMode, toggleColorMode } = useColorMode();
  const [playMusic, setPlayMusic] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const playerRef = useRef(null);
  useEffect(() => {
    const fetchSavedCityData = async () => {
      const savedCity = localStorage.getItem("city");
      if (savedCity) {
        setCity(savedCity);
        await fetchForecast(savedCity);
      }
    };

    fetchSavedCityData();
  }, []);

  const fetchForecast = async (cityName) => {
    try {
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${
          cityName || city
        }&appid=${API_KEY}`
      );
      setForecastData(forecastResponse.data);

      const currentWeatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${
          cityName || city
        }&appid=${API_KEY}`
      );
      setCurrentWeather(currentWeatherResponse.data);

      localStorage.setItem("city", city);

      // Check if the weather is rainy and start playing music
      if (currentWeatherResponse.data.weather[0].main === "Rain") {
        setPlayMusic(true);
        playerRef.current.seekTo(0);
        document.body.classList.add("rain-bg");
      } else {
        setPlayMusic(false);
        document.body.classList.remove("rain-bg");
      }

      const weatherAlertsResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${currentWeatherResponse.data.coord.lat}&lon=${currentWeatherResponse.data.coord.lon}&appid=${API_KEY}`
      );
      setWeatherAlerts(weatherAlertsResponse.data.alerts);
    } catch (error) {
      console.error("Error fetching the weather data", error);
    }
  };

  const getChartData = () => {
    const labels = forecastData.list.map((item) => item.dt_txt);
    const temperatureData = forecastData.list.map(
      (item) => item.main.temp - 273.15
    );
    const humidityData = forecastData.list.map((item) => item.main.humidity);
    const windSpeedData = forecastData.list.map((item) => item.wind.speed);
    const precipitationData = forecastData.list.map((item) =>
      item.rain ? item.rain["3h"] : 0
    );

    return {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temperatureData,
          borderColor: "#00ff00",
          fill: false,
        },
        {
          label: "Humidity (%)",
          data: humidityData,
          borderColor: "#ff0000",
          fill: false,
        },
        {
          label: "Wind Speed (m/s)",
          data: windSpeedData,
          borderColor: "#0000ff",
          fill: false,
        },
        {
          label: "Precipitation (mm)",
          data: precipitationData,
          borderColor: "#ff00ff",
          fill: false,
        },
      ],
    };
  };

  const chartOptions = {
    scales: {
      x: {
        grid: {
          color: colorMode === "dark" ? "white" : "black",
        },
        ticks: {
          color: colorMode === "dark" ? "white" : "black",
        },
      },
      y: {
        grid: {
          color: colorMode === "dark" ? "white" : "black",
        },
        ticks: {
          color: colorMode === "dark" ? "white" : "black",
        },
      },
    },
  };

  return (
    <Box
      className={
        currentWeather && currentWeather.weather[0].main === "Rain"
          ? "rain-bg"
          : ""
      }
    >
      <Flex
        bg="blue.500"
        color="white"
        justifyContent="space-between"
        alignItems="center"
        p={4}
      >
        <Heading>Weather Dashboard</Heading>
        <IconButton
          icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          isRound="true"
        />
      </Flex>
      <Container maxW="container.xl" mt={5}>
        <VStack spacing={4}>
          <FormControl
            as="form"
            display="flex"
            onSubmit={(e) => {
              e.preventDefault();
              fetchForecast(city);
              setUserInteracted(true);
            }}
          >
            <Input
              placeholder="Enter city"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setUserInteracted(true);
              }}
            />
            <Button
              colorScheme="teal"
              ml={2}
              onClick={() => {
                fetchForecast(city);
                setUserInteracted(true);
              }}
            >
              Search
            </Button>
          </FormControl>
          <Flex direction={["column", "row"]} spacing={4} w="100%">
            {currentWeather && (
              <Box
                p={4}
                border="1px solid"
                borderRadius="md"
                borderColor={
                  colorMode === "dark" ? "whiteAlpha.300" : "gray.300"
                }
                flex="1"
                mb={4}
              >
                <Heading size="md">
                  Current Weather for {currentWeather.name}
                </Heading>
                <Text>
                  Temperature: {Math.round(currentWeather.main.temp - 273.15)}°C
                </Text>
                <Text>Weather: {currentWeather.weather[0].description}</Text>
                <Image
                  src={`http://openweathermap.org/img/w/${currentWeather.weather[0].icon}.png`}
                  alt="Weather icon"
                />
                <Text>
                  Sunrise:{" "}
                  {new Date(
                    currentWeather.sys.sunrise * 1000
                  ).toLocaleTimeString()}
                </Text>
                <Text>
                  Sunset:{" "}
                  {new Date(
                    currentWeather.sys.sunset * 1000
                  ).toLocaleTimeString()}
                </Text>
              </Box>
            )}
            {forecastData && (
              <Box
                p={4}
                border="1px solid"
                borderRadius="md"
                borderColor={
                  colorMode === "dark" ? "whiteAlpha.300" : "gray.300"
                }
                flex="1"
                mb={4}
              >
                <Heading size="md">
                  5-Day Forecast for {forecastData.city.name}
                </Heading>
                <List>
                  {forecastData.list.slice(0, 5).map((item, index) => (
                    <ListItem key={index}>
                      {item.dt_txt.split(" ")[0]} {item.dt_txt.split(" ")[1]}:{" "}
                      {Math.round(item.main.temp - 273.15)}°C,{" "}
                      {item.weather[0].description}
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Flex>

          {weatherAlerts && (
            <Box
              p={4}
              border="1px solid"
              borderRadius="md"
              borderColor={colorMode === "dark" ? "whiteAlpha.300" : "gray.300"}
              mt={4}
              w="100%"
            >
              <Heading size="md">Weather Alerts</Heading>
              <List>
                {weatherAlerts.map((alert, index) => (
                  <ListItem key={index}>
                    {alert.event}: {alert.description}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          {forecastData && (
            <Box
              p={4}
              border="1px solid"
              borderRadius="md"
              borderColor={colorMode === "dark" ? "whiteAlpha.300" : "gray.300"}
              mt={4}
              w="100%"
            >
              <Line data={getChartData()} options={chartOptions} />
            </Box>
          )}
        </VStack>
      </Container>
      <ReactPlayer
        ref={playerRef}
        url="https://soundcloud.com/lemmino/cipher?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing"
        playing={playMusic && userInteracted}
        loop={true}
        width="0"
        height="0"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
    </Box>
  );
}

export default App;
